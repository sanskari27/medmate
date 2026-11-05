package com.medmate.servercore.master;

import com.medmate.servercore.identity.ImpersonationAudit;
import com.medmate.servercore.identity.SessionRow;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ImpersonationRecorder implements ImpersonationAudit {
    private final JdbcTemplate jdbc;

    public ImpersonationRecorder(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void ended(SessionRow session) {
        if (session == null || session.impersonator() == null) {
            return;
        }
        jdbc.update("""
                INSERT INTO master_audit (phone, pharmacy_id, action, "before", "after", reason)
                VALUES (?,?,?,?::jsonb,?::jsonb,?)
                """, session.impersonator(), session.pharmacyId(), "impersonate-end", "{}",
                "{\"userId\":\"" + session.userId() + "\"}", "");
    }

    public void record(String phone, UUID pharmacyId, String action, String before, String after, String reason) {
        jdbc.update("""
                INSERT INTO master_audit (phone, pharmacy_id, action, "before", "after", reason)
                VALUES (?,?,?,?::jsonb,?::jsonb,?)
                """, phone, pharmacyId, action, before, after, reason == null ? "" : reason);
    }
}
