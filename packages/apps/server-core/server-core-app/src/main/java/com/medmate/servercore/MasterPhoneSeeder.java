package com.medmate.servercore;

import com.medmate.servercore.kernel.PhoneNumbers;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class MasterPhoneSeeder implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    private final String configured;

    public MasterPhoneSeeder(JdbcTemplate jdbc, @Value("${app.master-phones:}") String configured) {
        this.jdbc = jdbc;
        this.configured = configured;
    }

    @Override
    public void run(ApplicationArguments args) {
        String raw = System.getenv("MASTER_PHONES");
        if (raw == null || raw.isBlank()) {
            raw = configured;
        }
        if (raw == null || raw.isBlank()) {
            return;
        }
        for (String part : raw.split(",")) {
            String phone = part.trim();
            if (!phone.isEmpty()) {
                jdbc.update("INSERT INTO master_phones (phone) VALUES (?) ON CONFLICT DO NOTHING", PhoneNumbers.e164(phone));
            }
        }
    }
}
