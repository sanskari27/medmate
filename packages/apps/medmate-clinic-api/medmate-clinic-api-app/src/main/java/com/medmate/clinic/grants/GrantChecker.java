package com.medmate.clinic.grants;

import com.medmate.clinic.security.ClinicPrincipal;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;
import javax.sql.DataSource;
import org.springframework.jdbc.core.JdbcTemplate;

public final class GrantChecker {

    public static final String PATIENTS_READ = "clinic:patients:read";
    public static final String PATIENTS_READ_CLINICAL = "clinic:patients:read_clinical";
    public static final String BILLING_READ = "clinic:billing:read";
    public static final String STAFF_READ = "clinic:staff:read";

    private static final Set<String> ALL = Set.of(PATIENTS_READ, PATIENTS_READ_CLINICAL, BILLING_READ, STAFF_READ);

    private final JdbcTemplate jdbc;

    public GrantChecker(DataSource dataSource) {
        this.jdbc = new JdbcTemplate(Objects.requireNonNull(dataSource, "dataSource"));
    }

    public boolean holds(ClinicPrincipal principal, String grantKey) {
        Objects.requireNonNull(principal, "principal");
        Objects.requireNonNull(grantKey, "grantKey");
        Boolean held = jdbc.queryForObject(
                "select exists(select 1 from clinic_grant where account_id = ? and grant_key = ?)",
                Boolean.class,
                principal.accountId(),
                grantKey);
        return Boolean.TRUE.equals(held);
    }

    public Set<String> grants(ClinicPrincipal principal) {
        Objects.requireNonNull(principal, "principal");
        return new LinkedHashSet<>(jdbc.queryForList(
                "select grant_key from clinic_grant where account_id = ? order by grant_key",
                String.class,
                principal.accountId()));
    }

    public Set<String> allGrants() {
        return ALL;
    }
}
