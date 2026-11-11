package com.medmate.server.support.store;

import com.medmate.server.support.access.SupportRules;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class SupportStore {

    private final JdbcClient jdbc;

    public SupportStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record FaqRow(UUID id, String question, String answer, int position, boolean published) {}

    public record CaseRow(
            UUID id,
            long ticketNumber,
            UUID pharmacyId,
            UUID openedBy,
            String subject,
            String category,
            SupportRules.Status status,
            UUID assigneeId,
            Instant createdAt,
            Instant resolvedAt,
            UUID resolvedBy) {}

    public record MessageRow(UUID id, UUID caseId, UUID authorId, String body, Instant createdAt) {}

    public List<FaqRow> faqs(boolean publishedOnly) {
        String sql = publishedOnly
                ? "SELECT id, question, answer, position, published FROM support_faq WHERE published ORDER BY position, id"
                : "SELECT id, question, answer, position, published FROM support_faq ORDER BY position, id";
        return jdbc.sql(sql).query(this::faq).list();
    }

    public List<UUID> faqIds() {
        return jdbc.sql("SELECT id FROM support_faq").query(UUID.class).list();
    }

    public Optional<FaqRow> findFaq(UUID id) {
        return jdbc.sql("SELECT id, question, answer, position, published FROM support_faq WHERE id = :id")
                .param("id", id)
                .query(this::faq)
                .optional();
    }

    public void insertFaq(UUID id, String question, String answer, int position, Instant now) {
        jdbc.sql(
                        """
                        INSERT INTO support_faq (id, question, answer, position, published, created_at, updated_at)
                        VALUES (:id, :question, :answer, :position, TRUE, :now, :now)
                        """)
                .param("id", id)
                .param("question", question)
                .param("answer", answer)
                .param("position", position)
                .param("now", Timestamp.from(now))
                .update();
    }

    public int nextFaqPosition() {
        Integer max = jdbc.sql("SELECT COALESCE(MAX(position), 0) FROM support_faq")
                .query(Integer.class)
                .single();
        return max + 1;
    }

    public void updateFaq(UUID id, String question, String answer, boolean published, Instant now) {
        jdbc.sql(
                        """
                        UPDATE support_faq
                        SET question = :question, answer = :answer, published = :published, updated_at = :now
                        WHERE id = :id
                        """)
                .param("id", id)
                .param("question", question)
                .param("answer", answer)
                .param("published", published)
                .param("now", Timestamp.from(now))
                .update();
    }

    public void setFaqPosition(UUID id, int position) {
        jdbc.sql("UPDATE support_faq SET position = :position WHERE id = :id")
                .param("id", id)
                .param("position", position)
                .update();
    }

    public CaseRow insertCase(UUID id, UUID pharmacyId, UUID openedBy, String subject, String category, Instant now) {
        Long ticketNumber = jdbc.sql(
                        """
                        INSERT INTO support_case (id, pharmacy_id, opened_by, subject, category, status, created_at)
                        VALUES (:id, :pharmacy, :opened, :subject, :category, 'waiting', :created)
                        RETURNING ticket_number
                        """)
                .param("id", id)
                .param("pharmacy", pharmacyId)
                .param("opened", openedBy)
                .param("subject", subject)
                .param("category", category)
                .param("created", Timestamp.from(now))
                .query(Long.class)
                .single();
        return new CaseRow(
                id,
                ticketNumber,
                pharmacyId,
                openedBy,
                subject,
                category,
                SupportRules.Status.WAITING,
                null,
                now,
                null,
                null);
    }

    public Optional<CaseRow> findCase(UUID id) {
        return jdbc.sql(caseSql() + " WHERE id = :id")
                .param("id", id)
                .query(this::caseRow)
                .optional();
    }

    public List<CaseRow> cases(UUID pharmacyId) {
        if (pharmacyId == null) {
            return jdbc.sql(caseSql() + " ORDER BY created_at DESC, id DESC")
                    .query(this::caseRow)
                    .list();
        }
        return jdbc.sql(caseSql() + " WHERE pharmacy_id = :pharmacy ORDER BY created_at DESC, id DESC")
                .param("pharmacy", pharmacyId)
                .query(this::caseRow)
                .list();
    }

    public boolean claim(UUID id, UUID assignee) {
        return jdbc.sql(
                                """
                        UPDATE support_case
                        SET status = 'open', assignee_id = :assignee
                        WHERE id = :id AND status = 'waiting'
                        """)
                        .param("id", id)
                        .param("assignee", assignee)
                        .update()
                == 1;
    }

    public boolean resolve(UUID id, UUID actor, Instant now) {
        return jdbc.sql(
                                """
                        UPDATE support_case
                        SET status = 'resolved', resolved_at = :now, resolved_by = :actor
                        WHERE id = :id AND status <> 'resolved'
                        """)
                        .param("id", id)
                        .param("actor", actor)
                        .param("now", Timestamp.from(now))
                        .update()
                == 1;
    }

    public boolean insertMessage(UUID id, UUID caseId, UUID authorId, String body, Instant now) {
        return jdbc.sql(
                                """
                        INSERT INTO support_message (id, case_id, author_id, body, created_at)
                        SELECT :id, :caseId, :author, :body, :created
                        WHERE EXISTS (
                            SELECT 1 FROM support_case WHERE id = :caseId AND status <> 'resolved'
                        )
                        """)
                        .param("id", id)
                        .param("caseId", caseId)
                        .param("author", authorId)
                        .param("body", body)
                        .param("created", Timestamp.from(now))
                        .update()
                == 1;
    }

    public List<MessageRow> messages(UUID caseId) {
        return jdbc.sql(
                        """
                        SELECT id, case_id, author_id, body, created_at
                        FROM support_message
                        WHERE case_id = :caseId
                        ORDER BY created_at, id
                        """)
                .param("caseId", caseId)
                .query(this::message)
                .list();
    }

    private static String caseSql() {
        return """
                SELECT id, ticket_number, pharmacy_id, opened_by, subject, category, status, assignee_id,
                       created_at, resolved_at, resolved_by
                FROM support_case
                """;
    }

    private FaqRow faq(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new FaqRow(
                rs.getObject("id", UUID.class),
                rs.getString("question"),
                rs.getString("answer"),
                rs.getInt("position"),
                rs.getBoolean("published"));
    }

    private CaseRow caseRow(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        Timestamp created = rs.getTimestamp("created_at");
        Timestamp resolved = rs.getTimestamp("resolved_at");
        return new CaseRow(
                rs.getObject("id", UUID.class),
                rs.getLong("ticket_number"),
                rs.getObject("pharmacy_id", UUID.class),
                rs.getObject("opened_by", UUID.class),
                rs.getString("subject"),
                rs.getString("category"),
                SupportRules.Status.parse(rs.getString("status")),
                rs.getObject("assignee_id", UUID.class),
                created.toInstant(),
                resolved == null ? null : resolved.toInstant(),
                rs.getObject("resolved_by", UUID.class));
    }

    private MessageRow message(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new MessageRow(
                rs.getObject("id", UUID.class),
                rs.getObject("case_id", UUID.class),
                rs.getObject("author_id", UUID.class),
                rs.getString("body"),
                rs.getTimestamp("created_at").toInstant());
    }
}
