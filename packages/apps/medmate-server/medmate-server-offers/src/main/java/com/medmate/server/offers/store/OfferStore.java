package com.medmate.server.offers.store;

import com.medmate.server.offers.OfferRules;
import java.math.BigDecimal;
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
public class OfferStore {

    private final JdbcClient jdbc;

    public OfferStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record OfferRow(
            String code,
            String title,
            String coupon,
            String type,
            BigDecimal value,
            String scope,
            String productId,
            boolean active) {}

    public boolean lockPharmacy(UUID pharmacyId) {
        return jdbc.sql("SELECT id FROM pharmacy WHERE id = :id FOR UPDATE")
                .param("id", pharmacyId)
                .query(UUID.class)
                .optional()
                .isPresent();
    }

    public int allocate(UUID pharmacyId) {
        Optional<Integer> current = jdbc.sql("SELECT last_number FROM offer_code WHERE pharmacy_id = :id FOR UPDATE")
                .param("id", pharmacyId)
                .query(Integer.class)
                .optional();
        int next = current.map(number -> number + 1).orElse(1);
        if (current.isEmpty()) {
            jdbc.sql("INSERT INTO offer_code (pharmacy_id, last_number) VALUES (:id, :number)")
                    .param("id", pharmacyId)
                    .param("number", next)
                    .update();
        } else {
            jdbc.sql("UPDATE offer_code SET last_number = :number WHERE pharmacy_id = :id")
                    .param("id", pharmacyId)
                    .param("number", next)
                    .update();
        }
        return next;
    }

    public List<OfferRow> list(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT code, title, coupon, discount_type, discount_value, scope, product_id, active
                        FROM offer
                        WHERE pharmacy_id = :id
                        ORDER BY created_at DESC, code DESC
                        """)
                .param("id", pharmacyId)
                .query(this::offer)
                .list();
    }

    public Optional<OfferRow> find(UUID pharmacyId, String code) {
        return jdbc.sql(
                        """
                        SELECT code, title, coupon, discount_type, discount_value, scope, product_id, active
                        FROM offer
                        WHERE pharmacy_id = :id AND code = :code
                        """)
                .param("id", pharmacyId)
                .param("code", code)
                .query(this::offer)
                .optional();
    }

    public void insert(UUID pharmacyId, String code, OfferRules.Draft draft, Instant createdAt) {
        jdbc.sql(
                        """
                        INSERT INTO offer (
                          pharmacy_id, code, title, coupon, discount_type, discount_value, scope, product_id,
                          active, created_at)
                        VALUES (
                          :pharmacy, :code, :title, :coupon, :type, :value, :scope, :product,
                          :active, :created)
                        """)
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .param("title", draft.title())
                .param("coupon", draft.code())
                .param("type", draft.type())
                .param("value", draft.value())
                .param("scope", draft.scope())
                .param("product", draft.target(), Types.VARCHAR)
                .param("active", draft.active())
                .param("created", Timestamp.from(createdAt))
                .update();
    }

    public void update(UUID pharmacyId, String code, OfferRules.Draft draft) {
        jdbc.sql(
                        """
                        UPDATE offer SET
                          title = :title, coupon = :coupon, discount_type = :type, discount_value = :value,
                          scope = :scope, product_id = :product, active = :active
                        WHERE pharmacy_id = :pharmacy AND code = :code
                        """)
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .param("title", draft.title())
                .param("coupon", draft.code())
                .param("type", draft.type())
                .param("value", draft.value())
                .param("scope", draft.scope())
                .param("product", draft.target(), Types.VARCHAR)
                .param("active", draft.active())
                .update();
    }

    public void delete(UUID pharmacyId, String code) {
        jdbc.sql("DELETE FROM offer WHERE pharmacy_id = :pharmacy AND code = :code")
                .param("pharmacy", pharmacyId)
                .param("code", code)
                .update();
    }

    private OfferRow offer(ResultSet row, int number) throws SQLException {
        return new OfferRow(
                row.getString("code"),
                row.getString("title"),
                row.getString("coupon"),
                row.getString("discount_type"),
                row.getBigDecimal("discount_value"),
                row.getString("scope"),
                row.getString("product_id"),
                row.getBoolean("active"));
    }
}
