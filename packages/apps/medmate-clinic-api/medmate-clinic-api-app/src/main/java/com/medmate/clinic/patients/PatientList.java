package com.medmate.clinic.patients;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

public final class PatientList {

    public record PatientPage(List<PatientItem> items, int page, int size, int total) {}

    public record PatientItem(
            UUID id,
            String name,
            int age,
            String sex,
            String phone,
            String status,
            BigDecimal due,
            String conditions,
            String allergies,
            boolean abha,
            String lastSeen) {}

    private static final int MAX_SIZE = 100;

    private final JdbcTemplate jdbc;
    private final UUID clinicId;

    public PatientList(DataSource dataSource, UUID clinicId) {
        this.jdbc = new JdbcTemplate(Objects.requireNonNull(dataSource, "dataSource"));
        this.clinicId = Objects.requireNonNull(clinicId, "clinicId");
    }

    public PatientPage search(UUID clinicId, String q, String status, Boolean due, int page, int size, String sort) {
        Objects.requireNonNull(clinicId, "clinicId");
        validate(page, size);
        List<Object> params = new ArrayList<>();
        List<String> conditions = new ArrayList<>();
        if (q != null && !q.isBlank()) {
            conditions.add("name ILIKE ?");
            params.add("%" + q + "%");
        }
        if (status != null && !status.isBlank()) {
            conditions.add("status = ?");
            params.add(status);
        }
        if (due != null) {
            if (due) {
                conditions.add("due > 0");
            } else {
                conditions.add("due = 0");
            }
        }
        String orderBy;
        if ("name".equals(sort)) {
            orderBy = "order by split_part(name, ' ', 2), split_part(name, ' ', 1), id";
        } else {
            orderBy = "order by id";
        }
        String whereSql = conditions.isEmpty() ? "" : " where " + String.join(" and ", conditions);
        String querySql = "select id, name, age, sex, phone, status, due, conditions, allergies, abha, last_seen "
                + "from patient"
                + whereSql
                + " "
                + orderBy
                + " limit ? offset ?";
        List<Object> queryParams = new ArrayList<>(params);
        queryParams.add(size);
        queryParams.add((page - 1) * size);
        List<PatientItem> items = jdbc.query(querySql, PATIENT_ROW_MAPPER, queryParams.toArray());
        String countSql = "select count(*) from patient" + whereSql;
        Integer total = jdbc.queryForObject(countSql, Integer.class, params.toArray());
        return new PatientPage(items, page, size, total == null ? 0 : total);
    }

    private static void validate(int page, int size) {
        if (page < 1) {
            throw new IllegalArgumentException("Page must be at least 1");
        }
        if (size < 1) {
            throw new IllegalArgumentException("Size must be at least 1");
        }
        if (size > MAX_SIZE) {
            throw new IllegalArgumentException("Size must not exceed 100");
        }
    }

    private static final RowMapper<PatientItem> PATIENT_ROW_MAPPER = (rs, rowNum) -> new PatientItem(
            rs.getObject("id", UUID.class),
            rs.getString("name"),
            rs.getInt("age"),
            rs.getString("sex"),
            rs.getString("phone"),
            rs.getString("status"),
            rs.getBigDecimal("due"),
            rs.getString("conditions"),
            rs.getString("allergies"),
            rs.getBoolean("abha"),
            rs.getString("last_seen"));
}
