package com.medmate.server.expenses.store;

import com.medmate.server.expenses.ExpenseRules;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class ExpenseStore {

    private static final String MATCH =
            """
            WHERE pharmacy_id = :pharmacy
              AND spent_on >= :from
              AND spent_on <= :to
              AND (CAST(:category AS text) = '' OR category = :category)
              AND (
                CAST(:pattern AS text) = ''
                OR lower(number) LIKE :pattern ESCAPE '\\'
                OR lower(party) LIKE :pattern ESCAPE '\\'
                OR lower(category) LIKE :pattern ESCAPE '\\'
                OR lower(COALESCE(note, '')) LIKE :pattern ESCAPE '\\'
              )
            """;

    private final JdbcClient jdbc;

    public ExpenseStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record ExpenseRow(
            String number,
            LocalDate spentOn,
            String party,
            String category,
            String paymentMode,
            BigDecimal amount,
            int gst,
            String note) {}

    public record AmountRow(BigDecimal amount, int gst) {}

    public record Filter(LocalDate from, LocalDate to, String category, String pattern) {}

    public boolean lockPharmacy(UUID pharmacyId) {
        return jdbc.sql("SELECT id FROM pharmacy WHERE id = :id FOR UPDATE")
                .param("id", pharmacyId)
                .query(UUID.class)
                .optional()
                .isPresent();
    }

    public int nextSeq(UUID pharmacyId) {
        return jdbc.sql("SELECT COALESCE(MAX(seq), 0) FROM expense WHERE pharmacy_id = :id")
                        .param("id", pharmacyId)
                        .query(Integer.class)
                        .single()
                + 1;
    }

    public void insert(UUID pharmacyId, int seq, ExpenseRules.Draft draft) {
        jdbc.sql(
                        """
                        INSERT INTO expense (
                            pharmacy_id, seq, number, spent_on, party, category, payment_mode, amount, gst, note
                        ) VALUES (
                            :pharmacy, :seq, :number, :spentOn, :party, :category, :mode, :amount, :gst, :note
                        )
                        """)
                .param("pharmacy", pharmacyId)
                .param("seq", seq)
                .param("number", ExpenseRules.number(seq))
                .param("spentOn", Date.valueOf(draft.spentOn()), Types.DATE)
                .param("party", draft.party(), Types.VARCHAR)
                .param("category", draft.category(), Types.VARCHAR)
                .param("mode", draft.paymentMode(), Types.VARCHAR)
                .param("amount", draft.amount())
                .param("gst", draft.gst())
                .param("note", draft.note(), Types.VARCHAR)
                .update();
    }

    public int count(UUID pharmacyId, Filter filter) {
        return jdbc.sql("SELECT COUNT(*) FROM expense " + MATCH)
                .param("pharmacy", pharmacyId)
                .param("from", Date.valueOf(filter.from()), Types.DATE)
                .param("to", Date.valueOf(filter.to()), Types.DATE)
                .param("category", filter.category(), Types.VARCHAR)
                .param("pattern", filter.pattern(), Types.VARCHAR)
                .query(Integer.class)
                .single();
    }

    public List<ExpenseRow> page(UUID pharmacyId, Filter filter, int limit, int offset) {
        return jdbc.sql("SELECT number, spent_on, party, category, payment_mode, amount, gst, note FROM expense "
                        + MATCH
                        + " ORDER BY spent_on DESC, seq DESC LIMIT :limit OFFSET :offset")
                .param("pharmacy", pharmacyId)
                .param("from", Date.valueOf(filter.from()), Types.DATE)
                .param("to", Date.valueOf(filter.to()), Types.DATE)
                .param("category", filter.category(), Types.VARCHAR)
                .param("pattern", filter.pattern(), Types.VARCHAR)
                .param("limit", limit)
                .param("offset", offset)
                .query(this::row)
                .list();
    }

    public List<ExpenseRow> export(UUID pharmacyId, Filter filter) {
        return jdbc.sql("SELECT number, spent_on, party, category, payment_mode, amount, gst, note FROM expense "
                        + MATCH
                        + " ORDER BY spent_on DESC, seq DESC")
                .param("pharmacy", pharmacyId)
                .param("from", Date.valueOf(filter.from()), Types.DATE)
                .param("to", Date.valueOf(filter.to()), Types.DATE)
                .param("category", filter.category(), Types.VARCHAR)
                .param("pattern", filter.pattern(), Types.VARCHAR)
                .query(this::row)
                .list();
    }

    public List<AmountRow> amounts(UUID pharmacyId, Filter filter) {
        return jdbc.sql("SELECT amount, gst FROM expense " + MATCH)
                .param("pharmacy", pharmacyId)
                .param("from", Date.valueOf(filter.from()), Types.DATE)
                .param("to", Date.valueOf(filter.to()), Types.DATE)
                .param("category", filter.category(), Types.VARCHAR)
                .param("pattern", filter.pattern(), Types.VARCHAR)
                .query((row, number) -> new AmountRow(row.getBigDecimal("amount"), row.getInt("gst")))
                .list();
    }

    public List<ExpenseRules.SavedCategory> categories(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT category, MIN(seq) AS first_seq
                        FROM expense
                        WHERE pharmacy_id = :id
                        GROUP BY category
                        ORDER BY MIN(seq)
                        """)
                .param("id", pharmacyId)
                .query((row, number) ->
                        new ExpenseRules.SavedCategory(row.getString("category"), row.getInt("first_seq")))
                .list();
    }

    private ExpenseRow row(ResultSet row, int number) throws SQLException {
        return new ExpenseRow(
                row.getString("number"),
                row.getDate("spent_on").toLocalDate(),
                row.getString("party"),
                row.getString("category"),
                row.getString("payment_mode"),
                row.getBigDecimal("amount"),
                row.getInt("gst"),
                row.getString("note"));
    }
}
