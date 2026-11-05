package com.medmate.servercore.master;

import com.medmate.servercore.identity.MasterAccess;
import com.medmate.servercore.identity.SecretHashes;
import java.sql.Timestamp;
import java.time.Instant;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class MasterSessions implements MasterAccess {
    private final JdbcTemplate jdbc;

    public MasterSessions(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public boolean isMasterPhone(String phone) {
        Integer count = jdbc.queryForObject("SELECT count(*) FROM master_phones WHERE phone = ?", Integer.class, phone);
        return count != null && count > 0;
    }

    @Override
    public String createSession(String phone) {
        String token = SecretHashes.randomToken();
        jdbc.update("INSERT INTO master_sessions (token, phone, expires_at) VALUES (?,?,?)",
                token, phone, Timestamp.from(Instant.now().plusSeconds(30L * 24 * 3600)));
        return token;
    }

    @Override
    public void destroySession(String token) {
        if (token != null && !token.isBlank()) {
            jdbc.update("DELETE FROM master_sessions WHERE token = ?", token);
        }
    }

    public String phone(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        var rows = jdbc.query("SELECT phone FROM master_sessions WHERE token = ? AND expires_at > now()",
                (row, index) -> row.getString("phone"), token);
        return rows.isEmpty() ? null : rows.get(0);
    }
}
