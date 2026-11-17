package com.medmate.clinic.patients;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.clinic.error.ApiExceptionHandler;
import com.medmate.clinic.routing.ClinicRegistryRow;
import com.medmate.clinic.routing.ClinicRouting;
import com.medmate.clinic.security.ClinicTokenVerifier;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class PatientRedactionTest {

    private static final UUID CLINIC_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID DOCTOR = UUID.fromString("11111111-1111-4111-8111-111111111103");
    private static final UUID FRONT_DESK = UUID.fromString("11111111-1111-4111-8111-111111111105");
    private static final UUID ADMIN = UUID.fromString("11111111-1111-4111-8111-111111111106");
    private static final UUID REYANSH = UUID.fromString("22222222-2222-2222-2222-222222222201");
    private static final String SECRET = "01234567890123456789012345678901";

    private DataSource dataSource;
    private MockMvc mvc;

    @BeforeEach
    void seed() throws Exception {
        dataSource = dataSource();
        seed(dataSource);
        ClinicTokenVerifier verifier = new ClinicTokenVerifier(SECRET);
        ClinicRouting routing = new ClinicRouting(
                clinicId -> Optional.of(new ClinicRegistryRow(CLINIC_ID, "medmate_clinic_test", "Demo Clinic")),
                (row, principal) -> dataSource);
        PatientController controller = new PatientController(routing, verifier);
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    @Test
    void clinicalFieldsVisibleWithReadClinicalGrant() throws Exception {
        String token = token(SECRET, DOCTOR, CLINIC_ID, "doctor", Instant.now());
        mvc.perform(get("/clinic/patients").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(REYANSH.toString()))
                .andExpect(jsonPath("$.items[0].conditions").value("Heart disease"))
                .andExpect(jsonPath("$.items[0].abha").value(false))
                .andExpect(jsonPath("$.items[0].due").value(500));
    }

    @Test
    void removingReadClinicalStopsClinicalFieldsOnNextCall() throws Exception {
        String token = token(SECRET, DOCTOR, CLINIC_ID, "doctor", Instant.now());
        mvc.perform(get("/clinic/patients").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].conditions").value("Heart disease"));
        new JdbcTemplate(dataSource)
                .execute(
                        "delete from clinic_grant where account_id = '11111111-1111-4111-8111-111111111103' and grant_key = 'clinic:patients:read_clinical'");
        mvc.perform(get("/clinic/patients").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].conditions").doesNotExist());
    }

    @Test
    void onlyPatientsReadHidesClinicalAndDue() throws Exception {
        String token = token(SECRET, ADMIN, CLINIC_ID, "admin", Instant.now());
        mvc.perform(get("/clinic/patients").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].conditions").doesNotExist())
                .andExpect(jsonPath("$.items[0].allergies").doesNotExist())
                .andExpect(jsonPath("$.items[0].abha").doesNotExist())
                .andExpect(jsonPath("$.items[0].lastSeen").doesNotExist())
                .andExpect(jsonPath("$.items[0].due").doesNotExist());
    }

    @Test
    void dueVisibleWithBillingRead() throws Exception {
        String token = token(SECRET, FRONT_DESK, CLINIC_ID, "front_desk", Instant.now());
        mvc.perform(get("/clinic/patients").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].due").value(500))
                .andExpect(jsonPath("$.items[0].conditions").doesNotExist());
    }

    @Test
    void phoneIsAlwaysMasked() throws Exception {
        String token = token(SECRET, DOCTOR, CLINIC_ID, "doctor", Instant.now());
        mvc.perform(get("/clinic/patients").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].phone").value("••••• 99505"));
    }

    private DataSource dataSource() {
        DriverManagerDataSource ds = new DriverManagerDataSource();
        ds.setDriverClassName("org.postgresql.Driver");
        ds.setUrl("jdbc:postgresql://localhost:5432/medmate_clinic_test");
        ds.setUsername("rey");
        ds.setPassword("");
        return ds;
    }

    private void seed(DataSource ds) throws Exception {
        new JdbcTemplate(ds).execute("drop table if exists clinic_grant cascade");
        new JdbcTemplate(ds).execute("drop table if exists patient cascade");
        new ResourceDatabasePopulator(
                        new ClassPathResource("db/migration/V2__patients.sql"),
                        new ClassPathResource("db/migration/V3__clinic_grants.sql"))
                .execute(ds);
    }

    private String token(String secret, UUID accountId, UUID clinicId, String role, Instant now) throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(accountId.toString())
                .claim("clinicId", clinicId.toString())
                .claim("clinicRole", role)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(3600)))
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(secret.getBytes(StandardCharsets.UTF_8)));
        return jwt.serialize();
    }
}
