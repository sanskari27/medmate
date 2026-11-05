package com.medmate.servercore.identity;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SessionRepository {
    private final JdbcTemplate jdbc;
    private final SessionRotator rotator;

    public SessionRepository(JdbcTemplate jdbc, SessionRotator rotator) {
        this.jdbc = jdbc;
        this.rotator = rotator;
    }

    public record Issued(String access, String refresh, String sessionId) {
    }

    public Issued create(UUID pharmacyId, String userId, String phone, String impersonator, String secret) {
        String sessionId = SecretHashes.randomHex(32);
        String refresh = SecretHashes.randomToken();
        Instant expires = Instant.now().plusSeconds(EnvNumbers.refreshTtl());
        String access = JwtTokens.sign(userId, phone, pharmacyId.toString(), sessionId, secret, Instant.now().getEpochSecond(), EnvNumbers.accessTtl());
        jdbc.update("""
                INSERT INTO sessions (token, pharmacy_id, user_id, phone, expires_at, impersonator, refresh_hash, refresh_expires_at)
                VALUES (?,?,?,?,?,?,?,?)
                """, sessionId, pharmacyId, userId, phone, Timestamp.from(expires), impersonator, SecretHashes.sha256(refresh), Timestamp.from(expires));
        return new Issued(access, refresh, sessionId);
    }

    public SessionRow read(String token, String secret) {
        if (token == null || token.isBlank()) {
            return null;
        }
        String sessionId = token;
        if (token.contains(".")) {
            JwtTokens.Claims claims = JwtTokens.verify(token, secret, Instant.now().getEpochSecond(), false);
            if (claims == null) {
                return null;
            }
            sessionId = claims.sessionId();
        }
        String lookup = sessionId;
        return jdbc.query("""
                SELECT s.token, s.pharmacy_id, s.user_id, s.phone, s.pricing_unlocked, s.impersonator, s.expires_at,
                       p.pricing_pin, p.business_type, (sp.login_pin_hash IS NOT NULL) AS has_pin
                FROM sessions s JOIN pharmacies p ON p.id = s.pharmacy_id
                LEFT JOIN staff_phones sp ON sp.pharmacy_id = s.pharmacy_id AND sp.phone = s.phone
                WHERE s.token = ?
                """, result -> result.next() ? map(result) : null, lookup);
    }

    public void destroy(String sessionId) {
        if (sessionId != null) {
            jdbc.update("DELETE FROM sessions WHERE token = ?", sessionId);
        }
    }

    public void setUnlocked(String sessionId, boolean unlocked) {
        jdbc.update("UPDATE sessions SET pricing_unlocked = ? WHERE token = ?", unlocked, sessionId);
    }

    public void revokeRefresh(String presented) {
        String hash = SecretHashes.sha256(presented);
        jdbc.update("DELETE FROM sessions WHERE refresh_hash = ? OR refresh_previous = ?", hash, hash);
    }

    public Issued rotate(String presented, String secret) {
        return rotator.rotate(presented, secret);
    }

    private static SessionRow map(ResultSet result) throws SQLException {
        Instant expires = result.getTimestamp("expires_at").toInstant();
        if (expires.isBefore(Instant.now())) {
            return null;
        }
        String impersonator = result.getString("impersonator");
        return new SessionRow(
                result.getString("token"),
                result.getObject("pharmacy_id", UUID.class),
                result.getString("user_id"),
                result.getString("phone"),
                result.getBoolean("pricing_unlocked"),
                impersonator == null || impersonator.isBlank() ? null : impersonator,
                result.getString("pricing_pin"),
                result.getString("business_type"),
                expires,
                result.getBoolean("has_pin"));
    }
}
