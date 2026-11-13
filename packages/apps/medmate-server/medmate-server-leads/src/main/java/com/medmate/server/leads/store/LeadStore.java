package com.medmate.server.leads.store;

import com.medmate.server.leads.LeadRules;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class LeadStore {

    private static final String COLUMNS =
            """
            id, site, type, status, created_at, name, phone, email, pharmacy_name, city_pincode, area, city,
            preferred_time, monthly_sales, subject, message, source, notes, plan, consent
            """;

    private static final String MATCH =
            """
            WHERE (CAST(:status AS text) = '' OR status = :status)
              AND (CAST(:site AS text) = '' OR site = :site)
              AND (CAST(:type AS text) = '' OR type = :type)
            """;

    private final JdbcClient jdbc;

    public LeadStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record LeadRow(
            UUID id,
            String site,
            String type,
            String status,
            Instant createdAt,
            String name,
            String phone,
            String email,
            String pharmacyName,
            String cityPincode,
            String area,
            String city,
            String preferredTime,
            String monthlySales,
            String subject,
            String message,
            String source,
            String notes,
            String plan,
            Boolean consent) {}

    public LeadRow insert(LeadRules.Draft draft, Instant createdAt) {
        UUID id = UUID.randomUUID();
        jdbc.sql(
                        """
                        INSERT INTO website_leads (
                            id, site, type, status, created_at, name, phone, email, pharmacy_name, city_pincode,
                            area, city, preferred_time, monthly_sales, subject, message, source, notes, plan, consent
                        ) VALUES (
                            :id, :site, :type, 'new', :createdAt, :name, :phone, :email, :pharmacyName, :cityPincode,
                            :area, :city, :preferredTime, :monthlySales, :subject, :message, :source, :notes, :plan,
                            :consent
                        )
                        """)
                .param("id", id)
                .param("site", draft.site(), Types.VARCHAR)
                .param("type", draft.type(), Types.VARCHAR)
                .param("createdAt", Timestamp.from(createdAt))
                .param("name", draft.name(), Types.VARCHAR)
                .param("phone", draft.phone(), Types.VARCHAR)
                .param("email", draft.email(), Types.VARCHAR)
                .param("pharmacyName", draft.pharmacyName(), Types.VARCHAR)
                .param("cityPincode", draft.cityPincode(), Types.VARCHAR)
                .param("area", draft.area(), Types.VARCHAR)
                .param("city", draft.city(), Types.VARCHAR)
                .param("preferredTime", draft.preferredTime(), Types.VARCHAR)
                .param("monthlySales", draft.monthlySales(), Types.VARCHAR)
                .param("subject", draft.subject(), Types.VARCHAR)
                .param("message", draft.message(), Types.VARCHAR)
                .param("source", draft.source(), Types.VARCHAR)
                .param("notes", draft.notes(), Types.VARCHAR)
                .param("plan", draft.plan(), Types.VARCHAR)
                .param("consent", draft.consent(), Types.BOOLEAN)
                .update();
        return new LeadRow(
                id,
                draft.site(),
                draft.type(),
                "new",
                createdAt,
                draft.name(),
                draft.phone(),
                draft.email(),
                draft.pharmacyName(),
                draft.cityPincode(),
                draft.area(),
                draft.city(),
                draft.preferredTime(),
                draft.monthlySales(),
                draft.subject(),
                draft.message(),
                draft.source(),
                draft.notes(),
                draft.plan(),
                draft.consent());
    }

    public int count(String status, String site, String type) {
        return jdbc.sql("SELECT COUNT(*) FROM website_leads " + MATCH)
                .param("status", status, Types.VARCHAR)
                .param("site", site, Types.VARCHAR)
                .param("type", type, Types.VARCHAR)
                .query(Integer.class)
                .single();
    }

    public List<LeadRow> page(String status, String site, String type, int limit, int offset) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM website_leads " + MATCH
                        + " ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset")
                .param("status", status, Types.VARCHAR)
                .param("site", site, Types.VARCHAR)
                .param("type", type, Types.VARCHAR)
                .param("limit", limit)
                .param("offset", offset)
                .query(LeadStore::row)
                .list();
    }

    public Optional<LeadRow> find(UUID id) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM website_leads WHERE id = :id")
                .param("id", id)
                .query(LeadStore::row)
                .optional();
    }

    public Optional<LeadRow> updateStatus(UUID id, String status) {
        int updated = jdbc.sql("UPDATE website_leads SET status = :status WHERE id = :id")
                .param("status", status, Types.VARCHAR)
                .param("id", id)
                .update();
        if (updated == 0) {
            return Optional.empty();
        }
        return find(id);
    }

    private static LeadRow row(ResultSet rs, int number) throws SQLException {
        Timestamp created = rs.getTimestamp("created_at");
        return new LeadRow(
                rs.getObject("id", UUID.class),
                rs.getString("site"),
                rs.getString("type"),
                rs.getString("status"),
                created.toInstant(),
                rs.getString("name"),
                rs.getString("phone"),
                rs.getString("email"),
                rs.getString("pharmacy_name"),
                rs.getString("city_pincode"),
                rs.getString("area"),
                rs.getString("city"),
                rs.getString("preferred_time"),
                rs.getString("monthly_sales"),
                rs.getString("subject"),
                rs.getString("message"),
                rs.getString("source"),
                rs.getString("notes"),
                rs.getString("plan"),
                (Boolean) rs.getObject("consent"));
    }
}
