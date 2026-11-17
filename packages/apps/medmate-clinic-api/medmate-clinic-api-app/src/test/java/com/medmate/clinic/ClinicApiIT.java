package com.medmate.clinic;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class ClinicApiIT {

    private static final String SECRET = "01234567890123456789012345678901";
    private static final UUID CLINIC_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID SECOND_CLINIC_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID DOCTOR = UUID.fromString("11111111-1111-4111-8111-111111111101");
    private static final UUID FRONT_DESK = UUID.fromString("11111111-1111-4111-8111-111111111105");
    private static final UUID RECEPTIONIST = UUID.fromString("11111111-1111-4111-8111-111111111107");
    private static final UUID SECOND_PATIENT = UUID.fromString("44444444-4444-4444-4444-444444444401");
    private static final String HOST = "127.0.0.1";
    private static final int PORT = 5432;
    private static final String USER = "rey";
    private static final String PASSWORD = "";
    private static final String REGISTRY_DB = "medmate_clinic_registry_it";
    private static final String DEMO_CLINIC_DB = "medmate_clinic_11111111";
    private static final String SECOND_CLINIC_DB = "medmate_clinic_22222222";

    private static final DataSource ADMIN = dataSource("postgres");

    static {
        try {
            JdbcTemplate administration = new JdbcTemplate(ADMIN);
            for (String database : List.of(REGISTRY_DB, DEMO_CLINIC_DB, SECOND_CLINIC_DB)) {
                createDatabaseIfMissing(administration, database);
            }
        } catch (Exception exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    @DynamicPropertySource
    static void registryDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> url(REGISTRY_DB));
        registry.add("spring.datasource.username", () -> USER);
        registry.add("spring.datasource.password", () -> PASSWORD);
    }

    @Autowired
    private TestRestTemplate rest;

    @BeforeEach
    void resetClinics() throws Exception {
        JdbcTemplate registry = new JdbcTemplate(dataSource(REGISTRY_DB));
        registry.execute("delete from clinic_registry");
        registry.update(
                "insert into clinic_registry (clinic_id, database_name, display_name) values (?, ?, ?)",
                CLINIC_ID,
                DEMO_CLINIC_DB,
                "Demo Clinic");
        registry.update(
                "insert into clinic_registry (clinic_id, database_name, display_name) values (?, ?, ?)",
                SECOND_CLINIC_ID,
                SECOND_CLINIC_DB,
                "Second Clinic");
        seedDemoClinic();
        seedSecondClinic();
    }

    @Test
    void aClinicSessionTokenCarriesTheClinicAndReadsTheDemoClinicPatients() throws Exception {
        String token = sessionToken(DOCTOR, CLINIC_ID, "owner");
        assertThat(clinicIdOf(token)).isEqualTo(CLINIC_ID);

        ResponseEntity<JsonNode> patients = patients(token);
        assertThat(patients.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(patients.getBody().get("page").asInt()).isEqualTo(1);
        assertThat(patients.getBody().get("size").asInt()).isEqualTo(25);
        assertThat(patients.getBody().get("total").asInt()).isEqualTo(6);
        assertThat(patients.getBody().get("items")).hasSize(6);
    }

    @Test
    void theSameTokenRoutesToTheSecondClinicWhenTheRegistryPointsThere() throws Exception {
        JdbcTemplate registry = new JdbcTemplate(dataSource(REGISTRY_DB));
        registry.update(
                "update clinic_registry set database_name = ? where clinic_id = ?",
                "no-such-database",
                SECOND_CLINIC_ID);
        registry.update(
                "update clinic_registry set database_name = ? where clinic_id = ?", SECOND_CLINIC_DB, CLINIC_ID);

        String token = sessionToken(DOCTOR, CLINIC_ID, "owner");
        ResponseEntity<JsonNode> patients = patients(token);
        assertThat(patients.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(patients.getBody().get("total").asInt()).isEqualTo(1);
        assertThat(patients.getBody().get("items")).hasSize(1);
        assertThat(patients.getBody().get("items").get(0).get("id").asText()).isEqualTo(SECOND_PATIENT.toString());
    }

    @Test
    void aFrontDeskSessionGetsTheSameListWithoutClinicalFields() throws Exception {
        String token = sessionToken(FRONT_DESK, CLINIC_ID, "front_desk");
        ResponseEntity<JsonNode> patients = patients(token);
        assertThat(patients.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(patients.getBody().get("total").asInt()).isEqualTo(6);
        assertThat(patients.getBody().get("items")).hasSize(6);
        JsonNode item = patients.getBody().get("items").get(0);
        assertThat(item.get("due")).isNotNull();
        assertThat(item.has("conditions")).isFalse();
        assertThat(item.has("allergies")).isFalse();
        assertThat(item.has("abha")).isFalse();
        assertThat(item.has("lastSeen")).isFalse();
    }

    @Test
    void aReceptionistWithNoGrantsIsForbidden() throws Exception {
        String token = sessionToken(RECEPTIONIST, CLINIC_ID, "front_desk");
        ResponseEntity<JsonNode> patients = patients(token);
        assertThat(patients.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(patients.getBody().get("detail").asText()).isEqualTo("This action is not allowed.");
    }

    @Test
    void aTokenForAnUnregisteredClinicIsServiceUnavailable() throws Exception {
        String token = sessionToken(DOCTOR, UUID.fromString("33333333-3333-3333-3333-333333333333"), "owner");
        ResponseEntity<JsonNode> patients = patients(token);
        assertThat(patients.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(patients.getBody().get("detail").asText()).isEqualTo("Clinic records are unavailable");
    }

    @Test
    void clinicMeReportsTheClinicAndItsGrants() throws Exception {
        String token = sessionToken(DOCTOR, CLINIC_ID, "owner");
        ResponseEntity<JsonNode> me = me(token);
        assertThat(me.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(me.getBody().get("clinicId").asText()).isEqualTo(CLINIC_ID.toString());
        assertThat(me.getBody().get("clinicName").asText()).isEqualTo("Demo Clinic");
        assertThat(me.getBody().get("role").asText()).isEqualTo("owner");
        assertThat(me.getBody().get("grants")).hasSize(4);
    }

    private String sessionToken(UUID accountId, UUID clinicId, String clinicRole) throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(accountId.toString())
                .claim("clinicId", clinicId.toString())
                .claim("clinicRole", clinicRole)
                .issueTime(Date.from(Instant.now()))
                .expirationTime(Date.from(Instant.now().plusSeconds(3600)))
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(SECRET.getBytes(StandardCharsets.UTF_8)));
        return jwt.serialize();
    }

    private ResponseEntity<JsonNode> patients(String token) throws Exception {
        return rest.exchange("/clinic/patients", HttpMethod.GET, bearer(token), JsonNode.class);
    }

    private ResponseEntity<JsonNode> me(String token) throws Exception {
        return rest.exchange("/clinic/me", HttpMethod.GET, bearer(token), JsonNode.class);
    }

    private static HttpEntity<Void> bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return new HttpEntity<>(headers);
    }

    private static UUID clinicIdOf(String token) throws Exception {
        return UUID.fromString(
                SignedJWT.parse(token).getJWTClaimsSet().getClaim("clinicId").toString());
    }

    private static DataSource dataSource(String database) {
        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setUrl(url(database));
        dataSource.setUsername(USER);
        dataSource.setPassword(PASSWORD);
        return dataSource;
    }

    private static String url(String database) {
        return "jdbc:postgresql://" + HOST + ":" + PORT + "/" + database;
    }

    private static void createDatabaseIfMissing(JdbcTemplate administration, String database) {
        Boolean exists = administration.queryForObject(
                "select exists(select 1 from pg_database where datname = ?)", Boolean.class, database);
        if (!Boolean.TRUE.equals(exists)) {
            administration.execute("create database " + database);
        }
    }

    private void seedDemoClinic() throws Exception {
        new ResourceDatabasePopulator(
                        new ClassPathResource("db/migration/V2__patients.sql"),
                        new ClassPathResource("db/migration/V3__clinic_grants.sql"))
                .execute(dataSource(DEMO_CLINIC_DB));
    }

    private void seedSecondClinic() throws Exception {
        DataSource second = dataSource(SECOND_CLINIC_DB);
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V2__patients.sql")).execute(second);
        new JdbcTemplate(second).execute("delete from patient");
        new JdbcTemplate(second)
                .update(
                        "insert into patient (id, name, age, sex, phone, status, due, conditions, allergies, abha, last_seen) "
                                + "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        SECOND_PATIENT,
                        "Second Patient",
                        40,
                        "F",
                        "9876543211",
                        "waiting",
                        0,
                        null,
                        null,
                        false,
                        null);
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V3__clinic_grants.sql")).execute(second);
    }
}
