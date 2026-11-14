package com.medmate.server.doctors;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.sms.RecordingSmsSender;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("identity-it")
class DoctorsFlowIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        DoctorDatabase.register(registry);
    }

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private RecordingSmsSender sms;

    @Autowired
    private DataSource dataSource;

    @BeforeEach
    void reset() throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("TRUNCATE account, otp_challenge CASCADE");
        }
        sms.clear();
    }

    @Test
    void hospitalDoctorsAreCreatedUpdatedAndHiddenFromRetail() {
        JsonNode ownerSession = verify("9822000401", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        String pharmacyId = ownerSession.get("account").get("pharmacyId").asText();
        approve(pharmacyId, "hospital");

        ResponseEntity<JsonNode> created = rest.exchange(
                "/pharmacy/doctors", HttpMethod.POST, new HttpEntity<>(doctorForm(), bearer(owner)), JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode doctor = created.getBody().get("doctor");
        assertThat(doctor.get("code").asText()).isEqualTo("DR-ANU");
        assertThat(doctor.get("id").asText()).isNotBlank();
        assertThat(doctor.get("photo").get("fileName").asText()).isEqualTo("anu.png");
        assertThat(doctor.get("documents")).hasSize(1);
        assertThat(doctor.get("documents").get(0).get("verificationStatus").asText())
                .isEqualTo("pending");
        assertThat(doctor.get("windows").get(0).get("fee").asText()).isEqualTo("500.00");
        String id = doctor.get("id").asText();
        String documentId = doctor.get("documents").get(0).get("id").asText();

        ResponseEntity<JsonNode> updated = exchange(
                "/pharmacy/doctors/" + id,
                owner,
                Map.of(
                        "code",
                        "DR-RAO",
                        "documents",
                        List.of(Map.of("id", documentId, "verificationStatus", "verified"))),
                HttpMethod.PATCH);
        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updated.getBody().get("doctor").get("code").asText()).isEqualTo("DR-RAO");
        assertThat(updated.getBody()
                        .get("doctor")
                        .get("documents")
                        .get(0)
                        .get("verificationStatus")
                        .asText())
                .isEqualTo("verified");

        ResponseEntity<JsonNode> duplicate =
                exchange("/pharmacy/doctors", owner, doctorJson("dr-rao"), HttpMethod.POST);
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(duplicate.getBody().get("detail").asText()).isEqualTo("Doctor code is already in use");
        assertThat(get("/pharmacy/doctors", owner).get("doctors")).hasSize(1);

        ResponseEntity<JsonNode> badFile = rest.exchange(
                "/pharmacy/doctors", HttpMethod.POST, new HttpEntity<>(badDocument(), bearer(owner)), JsonNode.class);
        assertThat(badFile.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(badFile.getBody().get("detail").asText()).isEqualTo("File type is not allowed");

        String reader = staff(owner, "9822000402", List.of("doctors:read"));
        assertThat(get("/pharmacy/doctors", reader).get("doctors")).hasSize(1);
        ResponseEntity<JsonNode> denied = exchange("/pharmacy/doctors", reader, doctorJson("DR-NO"), HttpMethod.POST);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().get("detail").asText()).isEqualTo("Doctors cannot be created");

        JsonNode retailSession = verify("9822000403", "pharmacy", "signup", false);
        String retail = token(retailSession);
        approve(retailSession.get("account").get("pharmacyId").asText(), "pharmacy");
        ResponseEntity<JsonNode> hidden = exchange("/pharmacy/doctors", retail, doctorJson("DR-OUT"), HttpMethod.POST);
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(hidden.getBody().get("detail").asText()).isEqualTo("Doctors are only available for a hospital");
    }

    @Test
    void aDoctorMayKeepOneActiveDepartment() {
        JsonNode ownerSession = verify("9822000411", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        approve(ownerSession.get("account").get("pharmacyId").asText(), "hospital");

        String active = department(owner, "Cardiology", "CARD", true);
        String inactive = department(owner, "Archive", "OLD", false);

        ResponseEntity<JsonNode> created = exchange("/pharmacy/doctors", owner, doctorJson("DR-ANU"), HttpMethod.POST);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(created.getBody().get("doctor").get("department").isNull()).isTrue();
        String doctorId = created.getBody().get("doctor").get("id").asText();

        ResponseEntity<JsonNode> linked =
                exchange("/pharmacy/doctors/" + doctorId, owner, Map.of("departmentId", active), HttpMethod.PATCH);
        assertThat(linked.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(linked.getBody().get("doctor").get("department").get("code").asText())
                .isEqualTo("CARD");

        ResponseEntity<JsonNode> rejected =
                exchange("/pharmacy/doctors/" + doctorId, owner, Map.of("departmentId", inactive), HttpMethod.PATCH);
        assertThat(rejected.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(rejected.getBody().get("detail").asText()).isEqualTo("Department is inactive");
        assertThat(get("/pharmacy/doctors/" + doctorId, owner)
                        .get("doctor")
                        .get("department")
                        .get("code")
                        .asText())
                .isEqualTo("CARD");

        ResponseEntity<JsonNode> retired =
                exchange("/pharmacy/departments/" + active, owner, Map.of("isActive", false), HttpMethod.PATCH);
        assertThat(retired.getStatusCode()).isEqualTo(HttpStatus.OK);
        ResponseEntity<JsonNode> kept = exchange(
                "/pharmacy/doctors/" + doctorId,
                owner,
                Map.of("departmentId", active, "code", "DR-KEEP"),
                HttpMethod.PATCH);
        assertThat(kept.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(kept.getBody().get("doctor").get("code").asText()).isEqualTo("DR-KEEP");
        assertThat(kept.getBody()
                        .get("doctor")
                        .get("department")
                        .get("isActive")
                        .asBoolean())
                .isFalse();

        String editor = staff(owner, "9822000412", List.of("doctors:update"));
        assertThat(get("/pharmacy/departments", editor).get("departments")).hasSize(2);
        ResponseEntity<JsonNode> denied =
                exchange("/pharmacy/departments", editor, Map.of("name", "Ward", "code", "WARD"), HttpMethod.POST);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().get("detail").asText()).isEqualTo("Departments cannot be created");
    }

    private String department(String token, String name, String code, boolean active) {
        ResponseEntity<JsonNode> created = exchange(
                "/pharmacy/departments",
                token,
                Map.of("name", name, "code", code, "isActive", active),
                HttpMethod.POST);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return created.getBody().get("department").get("id").asText();
    }

    private MultiValueMap<String, Object> doctorForm() {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("code", "DR-ANU");
        body.add("firstName", "Anu");
        body.add("lastName", "Rao");
        body.add("displayName", "Dr Anu Rao");
        body.add("gender", "female");
        body.add("primaryMobile", "9886011111");
        body.add("registrationNumber", "KMC-1");
        body.add("qualification", "MBBS");
        body.add("specialization", "General medicine");
        body.add("workplaceName", "City Hospital");
        body.add("city", "Bengaluru");
        body.add("state", "Karnataka");
        body.add("pinCode", "560001");
        body.add(
                "windows",
                "[{\"type\":\"offline\",\"days\":[\"monday\"],\"start\":\"09:00\",\"end\":\"13:00\",\"fee\":\"500.00\"}]");
        body.add("documentTypes", "Medical registration certificate");
        body.add("documentStatuses", "pending");
        body.add("photo", file("anu.png", MediaType.IMAGE_PNG, new byte[] {1, 2, 3}));
        body.add("documents", file("certificate.pdf", MediaType.APPLICATION_PDF, new byte[] {4, 5}));
        return body;
    }

    private MultiValueMap<String, Object> badDocument() {
        MultiValueMap<String, Object> body = fields("DR-BAD");
        body.add("documentTypes", "Notes");
        body.add("documents", file("note.txt", MediaType.TEXT_PLAIN, "hello".getBytes(StandardCharsets.UTF_8)));
        return body;
    }

    private Map<String, Object> doctorJson(String code) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", code);
        body.put("firstName", "Anu");
        body.put("lastName", "Rao");
        body.put("displayName", "Dr Anu Rao");
        body.put("gender", "female");
        body.put("primaryMobile", "9886011111");
        body.put("registrationNumber", "KMC-1");
        body.put("qualification", "MBBS");
        body.put("specialization", "General medicine");
        body.put("workplaceName", "City Hospital");
        body.put("city", "Bengaluru");
        body.put("state", "Karnataka");
        body.put("pinCode", "560001");
        body.put(
                "windows",
                List.of(Map.of(
                        "type", "offline",
                        "days", List.of("monday"),
                        "start", "09:00",
                        "end", "13:00",
                        "fee", "0")));
        return body;
    }

    private MultiValueMap<String, Object> fields(String code) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        doctorJson(code).forEach((key, value) -> {
            if ("windows".equals(key)) {
                body.add(
                        key,
                        "[{\"type\":\"offline\",\"days\":[\"monday\"],\"start\":\"09:00\",\"end\":\"13:00\",\"fee\":\"0\"}]");
            } else {
                body.add(key, value);
            }
        });
        return body;
    }

    private static HttpEntity<ByteArrayResource> file(String name, MediaType type, byte[] bytes) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(type);
        ByteArrayResource resource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return name;
            }
        };
        return new HttpEntity<>(resource, headers);
    }

    private String staff(String owner, String phone, List<String> permissions) {
        ResponseEntity<JsonNode> created = rest.exchange(
                "/pharmacy/staff",
                HttpMethod.POST,
                new HttpEntity<>(
                        Map.of("phone", phone, "displayName", "Counter", "pin", "1357", "permissions", permissions),
                        bearer(owner)),
                JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        ResponseEntity<JsonNode> pin = rest.exchange(
                "/auth/pin",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("phone", phone, "accountType", "pharmacy", "pin", "1357"), json()),
                JsonNode.class);
        assertThat(pin.getStatusCode()).isEqualTo(HttpStatus.OK);
        return token(pin.getBody());
    }

    private void approve(String pharmacyId, String pharmacyType) {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute(
                    "UPDATE pharmacy SET verification_status = 'approved', name = 'City Hospital', pharmacy_type = '"
                            + pharmacyType
                            + "' WHERE id = '"
                            + pharmacyId
                            + "'");
        } catch (SQLException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private JsonNode get(String path, String token) {
        ResponseEntity<JsonNode> response =
                rest.exchange(path, HttpMethod.GET, new HttpEntity<>(bearer(token)), JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private ResponseEntity<JsonNode> exchange(String path, String token, Map<String, Object> body, HttpMethod method) {
        HttpHeaders headers = bearer(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange(path, method, new HttpEntity<>(body, headers), JsonNode.class);
    }

    private JsonNode verify(String phone, String type, String purpose, boolean bootstrap) {
        if (bootstrap) {
            HttpHeaders headers = json();
            headers.setBearerAuth("test-bootstrap");
            ResponseEntity<JsonNode> created = rest.exchange(
                    "/auth/admin-bootstrap",
                    HttpMethod.POST,
                    new HttpEntity<>(Map.of("phone", phone), headers),
                    JsonNode.class);
            assertThat(created.getStatusCode()).isEqualTo(HttpStatus.OK);
        }
        String code = send(phone, type, purpose);
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/otp/verify",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("phone", phone, "accountType", type, "purpose", purpose, "code", code), json()),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private String send(String phone, String type, String purpose) {
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("phone", phone, "accountType", type, "purpose", purpose), json()),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        String code = sms.latestCode("+91" + phone);
        assertThat(code).isNotBlank();
        return code;
    }

    private static String token(JsonNode session) {
        return session.get("accessToken").asText();
    }

    private static HttpHeaders bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private static HttpHeaders json() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
