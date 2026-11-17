package com.medmate.clinic.routing;

import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class JdbcClinicRegistry implements ClinicRegistry {

    private final JdbcTemplate jdbc;

    public JdbcClinicRegistry(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<ClinicRegistryRow> find(UUID clinicId) {
        return jdbc
                .query(
                        "select clinic_id, database_name, display_name from clinic_registry where clinic_id = ?",
                        (rs, rowNum) -> new ClinicRegistryRow(
                                rs.getObject("clinic_id", UUID.class),
                                rs.getString("database_name"),
                                rs.getString("display_name")),
                        clinicId)
                .stream()
                .findFirst();
    }
}
