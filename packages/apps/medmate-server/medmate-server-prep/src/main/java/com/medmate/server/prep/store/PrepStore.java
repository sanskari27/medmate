package com.medmate.server.prep.store;

import com.medmate.server.prep.PrepRules;
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
public class PrepStore {

    private final JdbcClient jdbc;

    public PrepStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record Header(UUID id, UUID ownerId, String name, Instant updatedAt) {}

    public record Summary(UUID id, UUID ownerId, String name, Instant updatedAt, int lineCount) {}

    public record StoredLine(
            int position,
            String productId,
            String productName,
            String batchNo,
            String expiry,
            Integer qty,
            Integer free,
            BigDecimal rate,
            BigDecimal mrp,
            Integer gst) {}

    public Header insert(UUID ownerId, String name, Instant updatedAt) {
        UUID id = UUID.randomUUID();
        jdbc.sql(
                        """
                        INSERT INTO prep_list (id, owner_account_id, name, name_key, created_at, updated_at)
                        VALUES (:id, :ownerId, :name, :nameKey, :updatedAt, :updatedAt)
                        """)
                .param("id", id)
                .param("ownerId", ownerId)
                .param("name", name, Types.VARCHAR)
                .param("nameKey", PrepRules.nameKey(name), Types.VARCHAR)
                .param("updatedAt", Timestamp.from(updatedAt))
                .update();
        return new Header(id, ownerId, name, updatedAt);
    }

    public boolean nameTaken(UUID ownerId, String name, UUID exceptId) {
        String key = PrepRules.nameKey(name);
        if (exceptId == null) {
            return count(
                            """
                            SELECT COUNT(*) FROM prep_list
                            WHERE owner_account_id = :ownerId AND name_key = :nameKey
                            """,
                            ownerId,
                            key,
                            null)
                    > 0;
        }
        return count(
                        """
                        SELECT COUNT(*) FROM prep_list
                        WHERE owner_account_id = :ownerId AND name_key = :nameKey AND id <> :exceptId
                        """,
                        ownerId,
                        key,
                        exceptId)
                > 0;
    }

    public List<Summary> list(UUID ownerId) {
        return jdbc.sql(
                        """
                        SELECT l.id, l.owner_account_id, l.name, l.updated_at, COUNT(n.position) AS line_count
                        FROM prep_list l
                        LEFT JOIN prep_line n ON n.list_id = l.id
                        WHERE l.owner_account_id = :ownerId
                        GROUP BY l.id
                        ORDER BY l.updated_at DESC, l.id DESC
                        """)
                .param("ownerId", ownerId)
                .query(PrepStore::summary)
                .list();
    }

    public Optional<Header> find(UUID id) {
        return jdbc.sql(
                        """
                        SELECT id, owner_account_id, name, updated_at
                        FROM prep_list
                        WHERE id = :id
                        """)
                .param("id", id)
                .query(PrepStore::header)
                .optional();
    }

    public int lineCount(UUID id) {
        return jdbc.sql("SELECT COUNT(*) FROM prep_line WHERE list_id = :id")
                .param("id", id)
                .query(Integer.class)
                .single();
    }

    public Header rename(UUID id, String name, Instant updatedAt) {
        jdbc.sql(
                        """
                        UPDATE prep_list
                        SET name = :name, name_key = :nameKey, updated_at = :updatedAt
                        WHERE id = :id
                        """)
                .param("name", name, Types.VARCHAR)
                .param("nameKey", PrepRules.nameKey(name), Types.VARCHAR)
                .param("updatedAt", Timestamp.from(updatedAt))
                .param("id", id)
                .update();
        return find(id).orElseThrow();
    }

    public List<StoredLine> lines(UUID id) {
        return jdbc.sql(
                        """
                        SELECT position, product_id, product_name, batch_no, expiry, qty, free_qty, rate, mrp, gst
                        FROM prep_line
                        WHERE list_id = :id
                        ORDER BY position
                        """)
                .param("id", id)
                .query(PrepStore::line)
                .list();
    }

    public void replaceLines(UUID id, List<PrepRules.Line> lines, Instant updatedAt) {
        jdbc.sql("DELETE FROM prep_line WHERE list_id = :id").param("id", id).update();
        int position = 1;
        for (PrepRules.Line line : lines) {
            jdbc.sql(
                            """
                            INSERT INTO prep_line (
                                list_id, position, product_id, product_name, batch_no, expiry, qty, free_qty, rate, mrp, gst
                            ) VALUES (
                                :id, :position, :productId, :productName, :batchNo, :expiry, :qty, :free, :rate, :mrp, :gst
                            )
                            """)
                    .param("id", id)
                    .param("position", position)
                    .param("productId", line.productId(), Types.VARCHAR)
                    .param("productName", line.productName(), Types.VARCHAR)
                    .param("batchNo", line.batchNo() == null ? "" : line.batchNo(), Types.VARCHAR)
                    .param("expiry", line.expiry(), Types.VARCHAR)
                    .param("qty", line.qty(), Types.INTEGER)
                    .param("free", line.free(), Types.INTEGER)
                    .param("rate", line.rate(), Types.NUMERIC)
                    .param("mrp", line.mrp(), Types.NUMERIC)
                    .param("gst", line.gst(), Types.INTEGER)
                    .update();
            position++;
        }
        jdbc.sql("UPDATE prep_list SET updated_at = :updatedAt WHERE id = :id")
                .param("updatedAt", Timestamp.from(updatedAt))
                .param("id", id)
                .update();
    }

    public void delete(UUID id) {
        jdbc.sql("DELETE FROM prep_list WHERE id = :id").param("id", id).update();
    }

    private int count(String sql, UUID ownerId, String nameKey, UUID exceptId) {
        var query = jdbc.sql(sql).param("ownerId", ownerId).param("nameKey", nameKey, Types.VARCHAR);
        if (exceptId != null) {
            query = query.param("exceptId", exceptId);
        }
        return query.query(Integer.class).single();
    }

    private static Summary summary(ResultSet rs, int row) throws SQLException {
        return new Summary(
                rs.getObject("id", UUID.class),
                rs.getObject("owner_account_id", UUID.class),
                rs.getString("name"),
                rs.getTimestamp("updated_at").toInstant(),
                rs.getInt("line_count"));
    }

    private static Header header(ResultSet rs, int row) throws SQLException {
        return new Header(
                rs.getObject("id", UUID.class),
                rs.getObject("owner_account_id", UUID.class),
                rs.getString("name"),
                rs.getTimestamp("updated_at").toInstant());
    }

    private static StoredLine line(ResultSet rs, int row) throws SQLException {
        return new StoredLine(
                rs.getInt("position"),
                rs.getString("product_id"),
                rs.getString("product_name"),
                rs.getString("batch_no"),
                rs.getString("expiry"),
                integer(rs, "qty"),
                integer(rs, "free_qty"),
                rs.getBigDecimal("rate"),
                rs.getBigDecimal("mrp"),
                integer(rs, "gst"));
    }

    private static Integer integer(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }
}
