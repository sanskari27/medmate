package com.medmate.servercore.master;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Plans;
import com.medmate.servercore.pharmacy.store.DocumentMaintenance;
import com.medmate.servercore.pharmacy.store.PharmacyStore;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class MasterLists {
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;
    private final PharmacyStore store;

    public MasterLists(JdbcTemplate jdbc, ObjectMapper mapper, PharmacyStore store) {
        this.jdbc = jdbc;
        this.mapper = mapper;
        this.store = store;
    }

    public ArrayNode pharmacies(String query, String plan, String businessType, String window) {
        String today = Plans.todayIso();
        String needle = query == null ? "" : query.trim().toLowerCase();
        String digits = needle.replaceAll("\\D", "");
        var rows = jdbc.queryForList("""
                SELECT id::text AS id, phone, business_type,
                       COALESCE(state#>>'{profile,name}', '') AS name,
                       COALESCE(state#>>'{profile,city}', '') AS city,
                       COALESCE(state#>>'{subscription,plan}', 'Essential') AS plan,
                       COALESCE(state#>>'{subscription,cycle}', 'monthly') AS cycle,
                       COALESCE(state#>>'{subscription,status}', 'active') AS status,
                       COALESCE(state#>>'{subscription,renewsOn}', '') AS renews_on,
                       COALESCE(state#>>'{profile,gstin}', '') AS gstin,
                       COALESCE(state#>>'{profile,pan}', '') AS pan,
                       COALESCE(state#>>'{profile,dlNo}', '') AS dl_no,
                       COALESCE(state#>>'{profile,fssai}', '') AS fssai,
                       COALESCE((NULLIF(state->>'extraSeats', ''))::int, 0) AS extra_seats,
                       (SELECT count(*)::int FROM jsonb_array_elements(COALESCE(state->'users', '[]'::jsonb)) u
                         WHERE COALESCE(u->>'active', 'true') <> 'false') AS in_use
                FROM pharmacies
                """);
        ArrayNode list = mapper.createArrayNode();
        for (var row : rows) {
            String rawPlan = String.valueOf(row.get("plan"));
            String named = Plans.asPlan(rawPlan);
            String rowPlan = named == null ? rawPlan : named;
            String phone = row.get("phone") == null ? "" : String.valueOf(row.get("phone"));
            String name = String.valueOf(row.get("name"));
            String city = String.valueOf(row.get("city"));
            if (!needle.isEmpty()) {
                boolean hit = name.toLowerCase().contains(needle) || city.toLowerCase().contains(needle)
                        || (digits.length() >= 4 && phone.replaceAll("\\D", "").contains(digits));
                if (!hit) {
                    continue;
                }
            }
            String wanted = plan == null || plan.isEmpty() ? "" : (Plans.asPlan(plan) == null ? plan : Plans.asPlan(plan));
            if (!wanted.isEmpty() && !wanted.equals(rowPlan)) {
                continue;
            }
            String kind = String.valueOf(row.get("business_type"));
            if (businessType != null && !businessType.isEmpty() && !businessType.equals(kind)) {
                continue;
            }
            String renews = String.valueOf(row.get("renews_on"));
            boolean lapsed = Plans.subscriptionLapsed(rowPlan, String.valueOf(row.get("status")), renews, today);
            if ("expired".equals(window) && !lapsed) {
                continue;
            }
            if ("7".equals(window) || "15".equals(window) || "30".equals(window)) {
                if (lapsed || !renews.matches("\\d{4}-\\d{2}-\\d{2}")) {
                    continue;
                }
                String end = java.time.LocalDate.parse(today).plusDays(Long.parseLong(window)).toString();
                if (renews.compareTo(today) < 0 || renews.compareTo(end) > 0) {
                    continue;
                }
            }
            ObjectNode item = list.addObject();
            item.put("id", String.valueOf(row.get("id")));
            item.put("phone", phone);
            item.put("name", name);
            item.put("city", city);
            item.put("plan", rowPlan);
            item.put("cycle", String.valueOf(row.get("cycle")));
            item.put("status", String.valueOf(row.get("status")));
            item.put("renewsOn", renews);
            item.put("businessType", kind);
            seats(item.putObject("seats"), rowPlan, ((Number) row.get("extra_seats")).intValue(), ((Number) row.get("in_use")).intValue());
            ObjectNode kyc = item.putObject("kyc");
            kyc.put("gstin", String.valueOf(row.get("gstin")));
            kyc.put("pan", String.valueOf(row.get("pan")));
            kyc.put("dlNo", String.valueOf(row.get("dl_no")));
            kyc.put("fssai", String.valueOf(row.get("fssai")));
        }
        return list;
    }

    public ObjectNode profile(String id) {
        UUID pharmacyId = parse(id);
        ObjectNode state = store.load(pharmacyId);
        var phones = jdbc.query("SELECT phone FROM pharmacies WHERE id = ?", (row, index) -> row.getString("phone"), pharmacyId);
        if (phones.isEmpty()) {
            throw new ApiError(404, "NOT_FOUND", "Pharmacy not found");
        }
        DocumentMaintenance.touch(state);
        return profileOf(id, phones.get(0), state);
    }

    public ArrayNode requests() {
        ArrayNode list = mapper.createArrayNode();
        jdbc.query("""
                SELECT id::text AS id, phone, COALESCE(state#>>'{profile,name}', '') AS name, state->'subscriptionRequests' AS requests
                FROM pharmacies
                """, (row, index) -> {
            JsonNode requests = read(row.getString("requests"));
            if (requests != null && requests.isArray()) {
                for (JsonNode request : requests) {
                    ObjectNode item = request.deepCopy();
                    String plan = Plans.asPlan(item.path("plan").asText());
                    if (plan != null) {
                        item.put("plan", plan);
                    }
                    item.put("pharmacyId", row.getString("id"));
                    item.put("pharmacyName", row.getString("name"));
                    item.put("phone", row.getString("phone"));
                    list.add(item);
                }
            }
            return null;
        });
        return list;
    }

    public ObjectNode work() {
        ArrayNode tickets = mapper.createArrayNode();
        ArrayNode referrals = mapper.createArrayNode();
        jdbc.query("""
                SELECT id::text AS id, phone, COALESCE(state#>>'{profile,name}', '') AS name, state->'tickets' AS tickets, state->'referrals' AS referrals
                FROM pharmacies
                """, (row, index) -> {
            addOpen(tickets, read(row.getString("tickets")), row);
            JsonNode rows = read(row.getString("referrals"));
            if (rows != null && rows.isArray()) {
                for (JsonNode referral : rows) {
                    ObjectNode item = referral.deepCopy();
                    item.put("pharmacyId", row.getString("id"));
                    item.put("pharmacyName", row.getString("name"));
                    item.put("phone", row.getString("phone"));
                    referrals.add(item);
                }
            }
            return null;
        });
        ObjectNode response = mapper.createObjectNode();
        response.set("tickets", tickets);
        response.set("referrals", referrals);
        return response;
    }

    public ArrayNode audit() {
        ArrayNode list = mapper.createArrayNode();
        jdbc.query("""
                SELECT a.phone, a.pharmacy_id::text AS pharmacy_id, a.action, a."before"::text AS before, a."after"::text AS after,
                       a.reason, a.at, COALESCE(p.state#>>'{profile,name}', '') AS pharmacy_name
                FROM master_audit a LEFT JOIN pharmacies p ON p.id = a.pharmacy_id
                ORDER BY a.at DESC LIMIT 100
                """, (row, index) -> {
            ObjectNode item = list.addObject();
            item.put("phone", row.getString("phone"));
            item.put("pharmacyId", row.getString("pharmacy_id"));
            item.put("pharmacyName", row.getString("pharmacy_name"));
            item.put("action", row.getString("action"));
            item.set("before", read(row.getString("before")));
            item.set("after", read(row.getString("after")));
            item.put("reason", row.getString("reason"));
            item.put("at", row.getTimestamp("at").toInstant().toString());
            return null;
        });
        return list;
    }

    public ObjectNode profileOf(String id, String phone, ObjectNode state) {
        ObjectNode profile = mapper.createObjectNode();
        profile.put("id", id);
        profile.put("phone", phone);
        profile.put("name", state.path("profile").path("name").asText());
        profile.put("city", state.path("profile").path("city").asText());
        profile.put("plan", state.path("subscription").path("plan").asText());
        profile.put("cycle", state.path("subscription").path("cycle").asText());
        profile.put("status", state.path("subscription").path("status").asText());
        profile.put("renewsOn", state.path("subscription").path("renewsOn").asText());
        int inUse = 0;
        for (JsonNode user : state.withArray("users")) {
            if (!user.has("active") || user.get("active").asBoolean(true)) {
                inUse++;
            }
        }
        seats(profile.putObject("seats"), state.path("subscription").path("plan").asText(), state.path("extraSeats").asInt(0), inUse);
        profile.put("businessType", state.path("businessType").asText());
        ObjectNode kyc = profile.putObject("kyc");
        kyc.put("gstin", state.path("profile").path("gstin").asText());
        kyc.put("pan", state.path("profile").path("pan").asText());
        kyc.put("dlNo", state.path("profile").path("dlNo").asText());
        kyc.put("fssai", state.path("profile").path("fssai").asText());
        kyc.put("pharmacist", state.path("profile").path("pharmacist").asText());
        if (state.get("bankAccount") instanceof ObjectNode bank) {
            ObjectNode shown = kyc.putObject("bank");
            shown.put("bankName", bank.path("bankName").asText());
            shown.put("accountNumber", bank.path("accountNumber").asText());
            shown.put("ifsc", bank.path("ifsc").asText());
        } else {
            kyc.putNull("bank");
        }
        ArrayNode open = profile.putArray("tickets");
        for (JsonNode ticket : state.withArray("tickets")) {
            if ("Open".equals(ticket.path("status").asText())) {
                open.add(ticket);
            }
        }
        profile.set("referrals", state.has("referrals") ? state.get("referrals") : mapper.createArrayNode());
        profile.set("grants", state.has("grants") ? state.get("grants") : mapper.createArrayNode());
        profile.set("requests", state.has("subscriptionRequests") ? state.get("subscriptionRequests") : mapper.createArrayNode());
        return profile;
    }

    private void addOpen(ArrayNode tickets, JsonNode rows, java.sql.ResultSet row) throws java.sql.SQLException {
        if (rows == null || !rows.isArray()) {
            return;
        }
        for (JsonNode ticket : rows) {
            if ("Open".equals(ticket.path("status").asText())) {
                ObjectNode item = ticket.deepCopy();
                item.put("pharmacyId", row.getString("id"));
                item.put("pharmacyName", row.getString("name"));
                item.put("phone", row.getString("phone"));
                tickets.add(item);
            }
        }
    }

    private JsonNode read(String json) {
        if (json == null) {
            return null;
        }
        try {
            return mapper.readTree(json);
        } catch (Exception exception) {
            return mapper.nullNode();
        }
    }

    static void seats(ObjectNode seats, String plan, int extra, int inUse) {
        Integer included = Plans.includedSeats(plan);
        if (included == null) {
            seats.putNull("included");
            seats.putNull("limit");
        } else {
            seats.put("included", included);
            Integer ceiling = Plans.seatCeiling(plan, extra);
            if (ceiling == null) {
                seats.putNull("limit");
            } else {
                seats.put("limit", ceiling);
            }
        }
        seats.put("extra", extra);
        seats.put("inUse", inUse);
    }

    static UUID parse(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException exception) {
            throw new ApiError(404, "NOT_FOUND", "Pharmacy not found");
        }
    }
}
