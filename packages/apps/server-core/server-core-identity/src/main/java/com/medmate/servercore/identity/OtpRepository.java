package com.medmate.servercore.identity;

import com.medmate.servercore.kernel.PhoneNumbers;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class OtpRepository {
    private final JdbcTemplate jdbc;
    private final DataSource dataSource;

    public OtpRepository(JdbcTemplate jdbc, DataSource dataSource) {
        this.jdbc = jdbc;
        this.dataSource = dataSource;
    }

    public OtpMachine.State load(String phone) {
        return jdbc.query("""
                SELECT otp_hash, expires_at, attempts, sent_at, send_count, window_start
                FROM otp_challenges WHERE phone = ?
                """, result -> result.next() ? map(result) : null, PhoneNumbers.e164(phone));
    }

    public void save(String phone, OtpMachine.State state) {
        jdbc.update("""
                INSERT INTO otp_challenges (phone, otp_hash, expires_at, attempts, sent_at, send_count, window_start)
                VALUES (?,?,?,?,?,?,?)
                ON CONFLICT (phone) DO UPDATE SET otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at,
                  attempts = EXCLUDED.attempts, sent_at = EXCLUDED.sent_at, send_count = EXCLUDED.send_count,
                  window_start = EXCLUDED.window_start
                """, PhoneNumbers.e164(phone), state.hash(), new Timestamp(state.expiresAt()), state.attempts(),
                new Timestamp(state.sentAt()), state.sendCount(), new Timestamp(state.windowStart()));
    }

    public String check(String phone, String code, int maxAttempts) {
        String key = PhoneNumbers.e164(phone);
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                OtpMachine.State state;
                try (PreparedStatement statement = connection.prepareStatement("""
                        SELECT otp_hash, expires_at, attempts, sent_at, send_count, window_start
                        FROM otp_challenges WHERE phone = ? FOR UPDATE
                        """)) {
                    statement.setString(1, key);
                    try (ResultSet rows = statement.executeQuery()) {
                        state = rows.next() ? map(rows) : null;
                    }
                }
                OtpMachine.Judged judged = OtpMachine.judge(state, code, System.currentTimeMillis(), maxAttempts);
                if (judged.next() == null) {
                    try (PreparedStatement delete = connection.prepareStatement("DELETE FROM otp_challenges WHERE phone = ?")) {
                        delete.setString(1, key);
                        delete.executeUpdate();
                    }
                } else {
                    try (PreparedStatement update = connection.prepareStatement("UPDATE otp_challenges SET attempts = ? WHERE phone = ?")) {
                        update.setInt(1, judged.next().attempts());
                        update.setString(2, key);
                        update.executeUpdate();
                    }
                }
                connection.commit();
                return judged.result();
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

    private static OtpMachine.State map(ResultSet row) throws java.sql.SQLException {
        String hash = row.getString("otp_hash");
        return new OtpMachine.State(
                hash == null ? "" : hash,
                row.getTimestamp("expires_at").getTime(),
                row.getInt("attempts"),
                row.getTimestamp("sent_at").getTime(),
                row.getInt("send_count"),
                row.getTimestamp("window_start").getTime());
    }
}
