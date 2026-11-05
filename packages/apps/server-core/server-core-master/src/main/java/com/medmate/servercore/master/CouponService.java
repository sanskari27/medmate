package com.medmate.servercore.master;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Plans;
import com.medmate.servercore.pharmacy.store.PharmacyStore;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class CouponService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final PharmacyStore store;

    public CouponService(JdbcTemplate jdbc, ObjectMapper mapper, PharmacyStore store) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.store = store;
    }

    public JsonNode list() {
        var list = mapper.createArrayNode();
        jdbc.query("""
                SELECT c.code, c.plan, to_char(c.expires_on, 'YYYY-MM-DD') AS expires_on, c.valid_days, c.created_at,
                       (SELECT count(*)::int FROM coupon_redemptions r WHERE r.code = c.code) AS redeemed
                FROM coupons c ORDER BY c.created_at DESC LIMIT 100
                """, (row, index) -> list.add(present(row.getString("code"), row.getString("plan"), row.getString("expires_on"), row.getInt("valid_days"), row.getInt("redeemed"), row.getTimestamp("created_at").toInstant().toString())));
        return list;
    }

    public ObjectNode issue(String phone, JsonNode body) {
        String code = code(body.path("code").asText());
        String plan = paid(body.path("plan").asText());
        String expiresOn = MasterWrites.date(body.path("expiresOn").asText(), "Enter an expiry date");
        if (expiresOn.compareTo(Plans.todayIso()) < 0) {
            throw new ApiError(400, "VALIDATION", "Expiry must be today or later");
        }
        int days = days(body.path("validDays").asDouble(Double.NaN));
        try {
            jdbc.update("INSERT INTO coupons (code, plan, expires_on, valid_days, created_by) VALUES (?,?,?::date,?,?)", code, plan, expiresOn, days, phone);
        } catch (org.springframework.dao.DuplicateKeyException exception) {
            throw new ApiError(400, "VALIDATION", "That code already exists", "code");
        }
        ObjectNode response = mapper.createObjectNode();
        response.put("code", code);
        response.put("plan", plan);
        response.put("expiresOn", expiresOn);
        response.put("validDays", days);
        return response;
    }

    public ObjectNode preview(UUID pharmacyId, String raw) {
        String code = code(raw);
        if (used(pharmacyId)) {
            throw new ApiError(400, "VALIDATION", "A coupon can be redeemed only once");
        }
        var rows = jdbc.query("SELECT code, plan, to_char(expires_on, 'YYYY-MM-DD') AS expires_on, valid_days FROM coupons WHERE code = ?",
                (row, index) -> present(row.getString("code"), row.getString("plan"), row.getString("expires_on"), row.getInt("valid_days"), 0, null), code);
        if (rows.isEmpty()) {
            throw new ApiError(404, "NOT_FOUND", "Coupon not found");
        }
        return rows.get(0);
    }

    public JsonNode redeem(UUID pharmacyId, String raw) {
        String code = code(raw);
        return store.withState(pharmacyId, (state, connection) -> {
            if (used(connection, pharmacyId) || state.path("couponRedeemed").asBoolean(false)) {
                throw new ApiError(400, "VALIDATION", "A coupon can be redeemed only once");
            }
            ObjectNode coupon = load(connection, code);
            if (coupon == null) {
                throw new ApiError(404, "NOT_FOUND", "Coupon not found");
            }
            if (coupon.path("expiresOn").asText().compareTo(Plans.todayIso()) < 0) {
                throw new ApiError(400, "VALIDATION", "This coupon has expired");
            }
            String plan = paid(coupon.path("plan").asText());
            int days = coupon.path("validDays").asInt();
            String renewsOn = java.time.LocalDate.now(java.time.ZoneOffset.UTC).plusDays(days).toString();
            String cycle = days >= 365 ? "annual" : "monthly";
            ObjectNode before = mapper.createObjectNode();
            before.put("plan", state.path("subscription").path("plan").asText());
            before.put("cycle", state.path("subscription").path("cycle").asText());
            before.put("renewsOn", state.path("subscription").path("renewsOn").asText());
            ObjectNode subscription = (ObjectNode) state.get("subscription");
            subscription.put("plan", plan);
            subscription.put("cycle", cycle);
            subscription.put("renewsOn", renewsOn);
            subscription.put("status", "active");
            for (JsonNode node : state.withArray("subscriptionRequests")) {
                if (node instanceof ObjectNode request && "open".equals(request.path("status").asText())) {
                    request.put("status", "handled");
                }
            }
            state.put("couponRedeemed", true);
            try (PreparedStatement insert = connection.prepareStatement("INSERT INTO coupon_redemptions (pharmacy_id, code) VALUES (?,?)")) {
                insert.setObject(1, pharmacyId);
                insert.setString(2, code);
                insert.executeUpdate();
            } catch (SQLException exception) {
                if ("23505".equals(exception.getSQLState())) {
                    throw new ApiError(400, "VALIDATION", "A coupon can be redeemed only once");
                }
                throw new IllegalStateException(exception);
            }
            ObjectNode after = mapper.createObjectNode();
            after.put("code", code);
            after.put("plan", plan);
            after.put("cycle", cycle);
            after.put("renewsOn", renewsOn);
            try (PreparedStatement audit = connection.prepareStatement(
                    "INSERT INTO master_audit (phone, pharmacy_id, action, \"before\", \"after\", reason) VALUES (?,?,?,?::jsonb,?::jsonb,?)")) {
                audit.setString(1, coupon.path("createdBy").asText(""));
                audit.setObject(2, pharmacyId);
                audit.setString(3, "coupon");
                audit.setString(4, before.toString());
                audit.setString(5, after.toString());
                audit.setString(6, code);
                audit.executeUpdate();
            } catch (SQLException exception) {
                if ("P0001".equals(exception.getSQLState())) {
                    throw new ApiError(500, "VALIDATION", "The audit record could not be saved");
                }
                throw new IllegalStateException(exception);
            }
            return subscription;
        });
    }

    private boolean used(UUID pharmacyId) {
        Integer count = jdbc.queryForObject("SELECT count(*) FROM coupon_redemptions WHERE pharmacy_id = ?", Integer.class, pharmacyId);
        return count != null && count > 0;
    }

    private static boolean used(Connection connection, UUID pharmacyId) {
        try (PreparedStatement statement = connection.prepareStatement("SELECT 1 FROM coupon_redemptions WHERE pharmacy_id = ?")) {
            statement.setObject(1, pharmacyId);
            try (ResultSet rows = statement.executeQuery()) {
                return rows.next();
            }
        } catch (SQLException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private ObjectNode load(Connection connection, String code) {
        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT code, plan, to_char(expires_on, 'YYYY-MM-DD') AS expires_on, valid_days, created_by FROM coupons WHERE code = ?")) {
            statement.setString(1, code);
            try (ResultSet rows = statement.executeQuery()) {
                if (!rows.next()) {
                    return null;
                }
                ObjectNode coupon = mapper.createObjectNode();
                coupon.put("plan", rows.getString("plan"));
                coupon.put("expiresOn", rows.getString("expires_on"));
                coupon.put("validDays", rows.getInt("valid_days"));
                coupon.put("createdBy", rows.getString("created_by"));
                return coupon;
            }
        } catch (SQLException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private ObjectNode present(String code, String plan, String expiresOn, int days, int redeemed, String createdAt) {
        ObjectNode coupon = mapper.createObjectNode();
        coupon.put("code", code);
        coupon.put("plan", Plans.asPlan(plan) == null ? plan : Plans.asPlan(plan));
        coupon.put("expiresOn", expiresOn);
        coupon.put("validDays", days);
        coupon.put("expired", expiresOn.compareTo(Plans.todayIso()) < 0);
        coupon.put("renewsOn", java.time.LocalDate.now(java.time.ZoneOffset.UTC).plusDays(days).toString());
        coupon.put("redeemed", redeemed);
        if (createdAt != null) {
            coupon.put("createdAt", createdAt);
        }
        return coupon;
    }

    static String code(String raw) {
        String code = raw == null ? "" : raw.trim().toUpperCase().replaceAll("\\s+", "");
        if (!code.matches("[A-Z0-9]{4,16}")) {
            throw new ApiError(400, "VALIDATION", "Use 4–16 letters or numbers", "code");
        }
        return code;
    }

    private static String paid(String value) {
        String plan = Plans.asPlan(value);
        if (plan == null) {
            throw new ApiError(400, "VALIDATION", "Choose a plan");
        }
        if (Plans.isFreePlan(plan)) {
            throw new ApiError(400, "VALIDATION", "Choose a paid plan");
        }
        return plan;
    }

    private static int days(double value) {
        if (value != Math.rint(value) || value < 1 || value > 3650) {
            throw new ApiError(400, "VALIDATION", "Plan validity must be 1–3650 days");
        }
        return (int) value;
    }
}
