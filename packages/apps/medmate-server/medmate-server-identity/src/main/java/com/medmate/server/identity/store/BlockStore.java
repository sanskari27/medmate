package com.medmate.server.identity.store;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile({"local", "prod", "identity-it"})
public class BlockStore {

    private final JdbcClient jdbc;

    public BlockStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public record OpenRequest(UUID id, UUID pharmacyId, String reason, String status, Instant requestedAt) {}

    public Optional<OpenRequest> find(UUID id) {
        return jdbc.sql(
                        """
                        SELECT id, pharmacy_id, reason, status, requested_at
                        FROM pharmacy_block_request
                        WHERE id = :id
                        """)
                .param("id", id)
                .query(this::read)
                .optional();
    }

    public Optional<OpenRequest> openForPharmacy(UUID pharmacyId) {
        return jdbc.sql(
                        """
                        SELECT id, pharmacy_id, reason, status, requested_at
                        FROM pharmacy_block_request
                        WHERE pharmacy_id = :pharmacy AND status = 'open'
                        """)
                .param("pharmacy", pharmacyId)
                .query(this::read)
                .optional();
    }

    public void insertOpen(UUID id, UUID pharmacyId, UUID requestedBy, String reason, Instant now) {
        jdbc.sql(
                        """
                        INSERT INTO pharmacy_block_request
                          (id, pharmacy_id, reason, status, requested_by, requested_at)
                        VALUES (:id, :pharmacy, :reason, 'open', :requestedBy, :requestedAt)
                        """)
                .param("id", id)
                .param("pharmacy", pharmacyId)
                .param("reason", reason)
                .param("requestedBy", requestedBy)
                .param("requestedAt", Timestamp.from(now))
                .update();
    }

    public boolean decide(UUID id, UUID pharmacyId, String status, UUID decidedBy, Instant now) {
        return jdbc.sql(
                                """
                        UPDATE pharmacy_block_request
                        SET status = :status, decided_by = :decidedBy, decided_at = :decidedAt
                        WHERE id = :id AND pharmacy_id = :pharmacy AND status = 'open'
                        """)
                        .param("id", id)
                        .param("pharmacy", pharmacyId)
                        .param("status", status)
                        .param("decidedBy", decidedBy)
                        .param("decidedAt", Timestamp.from(now))
                        .update()
                == 1;
    }

    private OpenRequest read(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
        return new OpenRequest(
                rs.getObject("id", UUID.class),
                rs.getObject("pharmacy_id", UUID.class),
                rs.getString("reason"),
                rs.getString("status"),
                rs.getTimestamp("requested_at").toInstant());
    }
}
