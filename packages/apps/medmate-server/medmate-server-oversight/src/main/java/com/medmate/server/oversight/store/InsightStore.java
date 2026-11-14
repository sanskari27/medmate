package com.medmate.server.oversight.store;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medmate.server.oversight.InsightViews;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class InsightStore {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final JdbcClient jdbc;

    public InsightStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record Profile(
            UUID id,
            String name,
            String phone,
            String status,
            String pharmacyType,
            String city,
            String state,
            String industry,
            String registrationType,
            List<String> businessTypes,
            boolean onlineOrders,
            boolean kiosk,
            boolean eInvoicing,
            boolean looseSelling,
            boolean lowStockAlerts,
            Instant createdAt,
            Instant submittedAt,
            Instant decidedAt,
            Instant approvedAt,
            Instant lastSale,
            boolean ownerDisabled) {}

    public record TicketRank(UUID pharmacyId, String name, int open) {}

    public record StaffMember(String name, boolean disabled, int permissions) {}

    public record KindCount(String kind, int count) {}

    public record Activity(
            long openingRupees,
            int products,
            int prescriptionProducts,
            int racksInUse,
            int emptyRacks,
            List<StaffMember> staff,
            int activeEmployees,
            int inactiveEmployees,
            int fullTime,
            int partTime,
            int contract,
            int buyers,
            int repeatBuyers,
            int consented,
            List<KindCount> reminders,
            int points,
            int campaigns,
            int reach,
            String rating,
            String nps,
            int offerPercent,
            int offerFlat,
            int stampedLines,
            List<InsightViews.SupportCase> cases) {

        public static Activity empty() {
            return new Activity(
                    0, 0, 0, 0, 0, List.of(), 0, 0, 0, 0, 0, 0, 0, 0, List.of(), 0, 0, 0, null, null, 0, 0, 0,
                    List.of());
        }
    }

    public List<Profile> profiles() {
        return jdbc.sql(
                        """
                        SELECT p.id, COALESCE(p.name, '') AS name, a.phone, p.verification_status, p.pharmacy_type,
                          p.city, p.state, p.industry, p.registration_type, p.business_types,
                          p.accept_online_orders, p.self_order_kiosk, p.e_invoicing, p.loose_selling, p.low_stock_alerts,
                          p.created_at, p.submitted_at, a.disabled AS owner_disabled,
                          decided.created_at AS decided_at, approved.created_at AS approved_at, sales.sold_at AS last_sale
                        FROM pharmacy p
                        JOIN account a ON a.id = p.owner_account_id
                        LEFT JOIN LATERAL (
                          SELECT created_at FROM review_decision
                          WHERE pharmacy_id = p.id
                          ORDER BY created_at DESC, id DESC
                          LIMIT 1
                        ) decided ON TRUE
                        LEFT JOIN LATERAL (
                          SELECT created_at FROM review_decision
                          WHERE pharmacy_id = p.id AND decision = 'approve'
                          ORDER BY created_at DESC, id DESC
                          LIMIT 1
                        ) approved ON TRUE
                        LEFT JOIN LATERAL (
                          SELECT MAX(sold_at) AS sold_at FROM bill WHERE pharmacy_id = p.id
                        ) sales ON TRUE
                        ORDER BY p.created_at, p.id
                        """)
                .query(this::profile)
                .list();
    }

    public List<Double> resolveHours() {
        return jdbc.sql(
                        """
                        SELECT EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600.0 AS hours
                        FROM support_case
                        WHERE resolved_at IS NOT NULL
                        """)
                .query((rs, row) -> rs.getDouble("hours"))
                .list();
    }

    public int openCases() {
        return (int) count("SELECT COUNT(*) FROM support_case WHERE status <> 'resolved'", null);
    }

    public List<TicketRank> ticketRanks() {
        return jdbc.sql(
                        """
                        SELECT p.id, COALESCE(NULLIF(btrim(p.name), ''), a.phone) AS name, COUNT(*) AS open
                        FROM support_case c
                        JOIN pharmacy p ON p.id = c.pharmacy_id
                        JOIN account a ON a.id = p.owner_account_id
                        WHERE c.status <> 'resolved'
                        GROUP BY p.id, p.name, a.phone
                        ORDER BY COUNT(*) DESC, name
                        LIMIT 5
                        """)
                .query((rs, row) ->
                        new TicketRank(rs.getObject("id", UUID.class), rs.getString("name"), rs.getInt("open")))
                .list();
    }

    public boolean exists(UUID pharmacyId) {
        return jdbc.sql("SELECT id FROM pharmacy WHERE id = :id")
                .param("id", pharmacyId)
                .query(UUID.class)
                .optional()
                .isPresent();
    }

    public Activity activity(UUID pharmacyId) {
        long opening =
                count("SELECT COALESCE(SUM(opening_balance), 0) FROM distributor WHERE pharmacy_id = :id", pharmacyId);
        int products = (int) count("SELECT COUNT(*) FROM inventory_product WHERE pharmacy_id = :id", pharmacyId);
        int prescribed = (int) count(
                "SELECT COUNT(*) FROM inventory_product WHERE pharmacy_id = :id AND prescription_required IS TRUE",
                pharmacyId);
        int racks = (int) count(
                """
                SELECT COUNT(*) FROM (
                  SELECT rack AS code FROM inventory_product
                  WHERE pharmacy_id = :id AND rack IS NOT NULL AND btrim(rack) <> ''
                  UNION
                  SELECT rack_alt FROM inventory_product
                  WHERE pharmacy_id = :id AND rack_alt IS NOT NULL AND btrim(rack_alt) <> ''
                ) used
                """,
                pharmacyId);
        int empty = (int) count(
                """
                SELECT COUNT(*) FROM rack r
                WHERE r.pharmacy_id = :id
                AND NOT EXISTS (
                  SELECT 1 FROM inventory_product p
                  WHERE p.pharmacy_id = r.pharmacy_id AND (p.rack = r.code OR p.rack_alt = r.code)
                )
                """,
                pharmacyId);
        List<StaffMember> staff = jdbc.sql(
                        """
                        SELECT COALESCE(a.display_name, '') AS name, a.disabled, COUNT(pp.permission_key) AS keys
                        FROM pharmacy_membership m
                        JOIN account a ON a.id = m.account_id
                        LEFT JOIN pharmacy_permission pp ON pp.account_id = a.id
                        WHERE m.pharmacy_id = :id
                        GROUP BY a.id, a.display_name, a.disabled
                        ORDER BY name, a.id
                        """)
                .param("id", pharmacyId)
                .query((rs, row) -> new StaffMember(rs.getString("name"), rs.getBoolean("disabled"), rs.getInt("keys")))
                .list();
        int[] employees = employees(pharmacyId);
        int buyers = (int) count(
                """
                SELECT COUNT(DISTINCT patient_phone) FROM bill
                WHERE pharmacy_id = :id AND patient_phone IS NOT NULL AND patient_phone <> ''
                """,
                pharmacyId);
        int repeat = (int) count(
                """
                SELECT COUNT(*) FROM (
                  SELECT patient_phone FROM bill
                  WHERE pharmacy_id = :id AND patient_phone IS NOT NULL AND patient_phone <> ''
                  GROUP BY patient_phone
                  HAVING COUNT(*) > 1
                ) repeat_buyers
                """,
                pharmacyId);
        int consented =
                (int) count("SELECT COUNT(*) FROM patient_profile WHERE pharmacy_id = :id AND consent", pharmacyId);
        List<KindCount> reminders = jdbc.sql(
                        """
                        SELECT kind, COUNT(*) AS n FROM patient_reminder
                        WHERE pharmacy_id = :id GROUP BY kind
                        """)
                .param("id", pharmacyId)
                .query((rs, row) -> new KindCount(rs.getString("kind"), rs.getInt("n")))
                .list();
        int points = (int)
                count("SELECT COALESCE(SUM(points), 0) FROM loyalty_redemption WHERE pharmacy_id = :id", pharmacyId);
        int[] campaigns = campaigns(pharmacyId);
        String[] feedback = feedback(pharmacyId);
        int[] offers = offers(pharmacyId);
        int stamped = (int) count(
                """
                SELECT COUNT(*) FROM bill_line
                WHERE pharmacy_id = :id AND offer_id IS NOT NULL AND offer_id <> ''
                """,
                pharmacyId);
        List<InsightViews.SupportCase> cases = jdbc.sql(
                        """
                        SELECT c.ticket_number, c.category, c.status,
                          COALESCE(assignee.display_name, '') AS assignee, c.created_at, c.resolved_at
                        FROM support_case c
                        LEFT JOIN account assignee ON assignee.id = c.assignee_id
                        WHERE c.pharmacy_id = :id
                        ORDER BY c.created_at DESC, c.id DESC
                        """)
                .param("id", pharmacyId)
                .query((rs, row) -> new InsightViews.SupportCase(
                        rs.getLong("ticket_number"),
                        rs.getString("category"),
                        rs.getString("status"),
                        rs.getString("assignee"),
                        rs.getTimestamp("created_at").toInstant(),
                        instant(rs, "resolved_at")))
                .list();
        return new Activity(
                opening,
                products,
                prescribed,
                racks,
                empty,
                staff,
                employees[0],
                employees[1],
                employees[2],
                employees[3],
                employees[4],
                buyers,
                repeat,
                consented,
                reminders,
                points,
                campaigns[0],
                campaigns[1],
                feedback[0],
                feedback[1],
                offers[0],
                offers[1],
                stamped,
                cases);
    }

    private int[] employees(UUID pharmacyId) {
        int[] counts = new int[5];
        jdbc.sql(
                        """
                        SELECT status, employment, COUNT(*) AS n
                        FROM employee WHERE pharmacy_id = :id
                        GROUP BY status, employment
                        """)
                .param("id", pharmacyId)
                .query((rs, row) -> {
                    int n = rs.getInt("n");
                    if ("active".equals(rs.getString("status"))) {
                        counts[0] += n;
                    } else {
                        counts[1] += n;
                    }
                    String employment = rs.getString("employment");
                    if ("Full-time".equals(employment)) {
                        counts[2] += n;
                    } else if ("Part-time".equals(employment)) {
                        counts[3] += n;
                    } else if ("Contract".equals(employment)) {
                        counts[4] += n;
                    }
                    return n;
                })
                .list();
        return counts;
    }

    private int[] campaigns(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT COUNT(*) AS n, COALESCE(SUM(reach), 0) AS reach
                        FROM crm_campaign WHERE pharmacy_id = :id
                        """)
                .param("id", pharmacyId)
                .query((rs, row) -> new int[] {rs.getInt("n"), rs.getInt("reach")})
                .single();
    }

    private String[] feedback(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT COUNT(*) AS n, AVG(rating) AS rating, AVG(nps) AS nps
                        FROM patient_feedback WHERE pharmacy_id = :id
                        """)
                .param("id", pharmacyId)
                .query((rs, row) -> {
                    if (rs.getLong("n") == 0) {
                        return new String[] {null, null};
                    }
                    return new String[] {average(rs.getBigDecimal("rating")), average(rs.getBigDecimal("nps"))};
                })
                .single();
    }

    private int[] offers(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT COUNT(*) FILTER (WHERE discount_type = 'pct') AS pct,
                          COUNT(*) FILTER (WHERE discount_type = 'flat') AS flat
                        FROM offer WHERE pharmacy_id = :id AND active
                        """)
                .param("id", pharmacyId)
                .query((rs, row) -> new int[] {rs.getInt("pct"), rs.getInt("flat")})
                .single();
    }

    private long count(String sql, UUID pharmacyId) {
        JdbcClient.StatementSpec spec = jdbc.sql(sql);
        if (pharmacyId != null) {
            spec = spec.param("id", pharmacyId);
        }
        Long value = spec.query(Long.class).single();
        return value == null ? 0 : value;
    }

    private Profile profile(ResultSet rs, int row) throws SQLException {
        return new Profile(
                rs.getObject("id", UUID.class),
                rs.getString("name"),
                rs.getString("phone"),
                rs.getString("verification_status"),
                rs.getString("pharmacy_type"),
                rs.getString("city"),
                rs.getString("state"),
                rs.getString("industry"),
                rs.getString("registration_type"),
                businessTypes(rs.getString("business_types")),
                rs.getBoolean("accept_online_orders"),
                rs.getBoolean("self_order_kiosk"),
                rs.getBoolean("e_invoicing"),
                rs.getBoolean("loose_selling"),
                rs.getBoolean("low_stock_alerts"),
                rs.getTimestamp("created_at").toInstant(),
                instant(rs, "submitted_at"),
                instant(rs, "decided_at"),
                instant(rs, "approved_at"),
                instant(rs, "last_sale"),
                rs.getBoolean("owner_disabled"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        Timestamp timestamp = rs.getTimestamp(column);
        return timestamp == null ? null : timestamp.toInstant();
    }

    private static List<String> businessTypes(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<String> types = JSON.readValue(json, new TypeReference<List<String>>() {});
            return types == null ? List.of() : types;
        } catch (Exception exception) {
            return List.of();
        }
    }

    private static String average(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
