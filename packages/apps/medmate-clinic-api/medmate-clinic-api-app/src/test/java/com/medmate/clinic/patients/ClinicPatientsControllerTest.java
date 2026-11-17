package com.medmate.clinic.patients;

import static org.hamcrest.Matchers.hasSize;
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

class ClinicPatientsControllerTest {

    private static final UUID CLINIC_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID OWNER = UUID.fromString("11111111-1111-4111-8111-111111111101");
    private static final UUID RECEPTIONIST = UUID.fromString("11111111-1111-4111-8111-111111111107");
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
    void noSessionIsUnauthorized() throws Exception {
        mvc.perform(get("/clinic/patients"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Session was not accepted"));
    }

    @Test
    void tokenWithoutPatientsReadIsForbidden() throws Exception {
        String token = token(SECRET, RECEPTIONIST, CLINIC_ID, "front_desk", Instant.now());
        mvc.perform(get("/clinic/patients").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("This action is not allowed."));
    }

    @Test
    void pageAndSizeDefault() throws Exception {
        String token = token(SECRET, OWNER, CLINIC_ID, "owner", Instant.now());
        mvc.perform(get("/clinic/patients").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(25))
                .andExpect(jsonPath("$.total").value(6))
                .andExpect(jsonPath("$.items", hasSize(6)));
    }

    @Test
    void sizeOverLimitIsBadRequest() throws Exception {
        String token = token(SECRET, OWNER, CLINIC_ID, "owner", Instant.now());
        mvc.perform(get("/clinic/patients").param("size", "101").header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void searchMatchesNameIgnoringCase() throws Exception {
        String token = token(SECRET, OWNER, CLINIC_ID, "owner", Instant.now());
        mvc.perform(get("/clinic/patients").param("q", "REYANSH").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].name").value("Reyansh Sharma"));
    }

    @Test
    void statusFilters() throws Exception {
        String token = token(SECRET, OWNER, CLINIC_ID, "owner", Instant.now());
        mvc.perform(get("/clinic/patients").param("status", "inactive").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(4));
    }

    @Test
    void dueTrueSelectsOutstanding() throws Exception {
        String token = token(SECRET, OWNER, CLINIC_ID, "owner", Instant.now());
        mvc.perform(get("/clinic/patients").param("due", "true").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].name").value("Reyansh Sharma"));
    }

    @Test
    void sortNameOrdersByLastThenFirst() throws Exception {
        String token = token(SECRET, OWNER, CLINIC_ID, "owner", Instant.now());
        mvc.perform(get("/clinic/patients").param("sort", "name").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].name").value("Mohammed Irfan"));
    }

    @Test
    void pagePastEndReturnsEmptyItemsWithRealTotal() throws Exception {
        String token = token(SECRET, OWNER, CLINIC_ID, "owner", Instant.now());
        mvc.perform(get("/clinic/patients").param("page", "999").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(0)))
                .andExpect(jsonPath("$.total").value(6));
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
