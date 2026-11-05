package com.medmate.servercore.identity;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.Instant;
import javax.sql.DataSource;
import org.springframework.stereotype.Component;

@Component
public class SessionRotator {
    private final DataSource dataSource;

    public SessionRotator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public SessionRepository.Issued rotate(String presented, String secret) {
        String presentedHash = SecretHashes.sha256(presented);
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                SessionRepository.Issued issued = rotate(connection, presentedHash, secret);
                connection.commit();
                return issued;
            } catch (RuntimeException exception) {
                connection.rollback();
                throw exception;
            }
        } catch (RuntimeException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private SessionRepository.Issued rotate(Connection connection, String presentedHash, String secret) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT token, pharmacy_id, user_id, phone, refresh_hash, refresh_previous, refresh_expires_at
                FROM sessions WHERE refresh_hash = ? OR refresh_previous = ? FOR UPDATE
                """)) {
            statement.setString(1, presentedHash);
            statement.setString(2, presentedHash);
            try (ResultSet rows = statement.executeQuery()) {
                if (!rows.next() || rows.getString("refresh_hash") == null) {
                    return null;
                }
                String token = rows.getString("token");
                String hash = rows.getString("refresh_hash");
                String previous = rows.getString("refresh_previous");
                Timestamp expiry = rows.getTimestamp("refresh_expires_at");
                String verdict = RefreshJudge.judge(new RefreshJudge.Row(hash, previous, expiry == null ? 0 : expiry.getTime()), presentedHash, System.currentTimeMillis());
                if ("invalid".equals(verdict)) {
                    return null;
                }
                if ("reuse".equals(verdict) || "expired".equals(verdict)) {
                    delete(connection, token);
                    return SessionRepository.Issued.class.cast(marker(verdict));
                }
                String refresh = SecretHashes.randomToken();
                Instant expires = Instant.now().plusSeconds(EnvNumbers.refreshTtl());
                try (PreparedStatement update = connection.prepareStatement("""
                        UPDATE sessions SET refresh_previous = refresh_hash, refresh_hash = ?, refresh_expires_at = ?, expires_at = ?
                        WHERE token = ? AND refresh_hash = ?
                        """)) {
                    update.setString(1, SecretHashes.sha256(refresh));
                    update.setTimestamp(2, Timestamp.from(expires));
                    update.setTimestamp(3, Timestamp.from(expires));
                    update.setString(4, token);
                    update.setString(5, presentedHash);
                    if (update.executeUpdate() == 0) {
                        delete(connection, token);
                        return marker("reuse");
                    }
                }
                String access = JwtTokens.sign(rows.getString("user_id"), rows.getString("phone"), rows.getString("pharmacy_id"), token, secret, Instant.now().getEpochSecond(), EnvNumbers.accessTtl());
                return new SessionRepository.Issued(access, refresh, token);
            }
        }
    }

    private static SessionRepository.Issued marker(String verdict) {
        return new SessionRepository.Issued(verdict, null, null);
    }

    private static void delete(Connection connection, String token) throws Exception {
        try (PreparedStatement statement = connection.prepareStatement("DELETE FROM sessions WHERE token = ?")) {
            statement.setString(1, token);
            statement.executeUpdate();
        }
    }
}
