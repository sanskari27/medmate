package com.medmate.server.employees;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.sms.RecordingSmsSender;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
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
class EmployeeFlowIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        EmployeeDatabase.register(registry);
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
    void employeesAreCodedScopedAndPermissioned() {
        JsonNode ownerSession = verify("9822000301", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        approve(ownerSession.get("account").get("pharmacyId").asText());

        JsonNode created = created(owner, "Anjali Menon", "9886012345");
        assertThat(created.get("employee").get("id").asText()).isEqualTo("EMP-001");
        assertThat(created.get("employee").get("employment").asText()).isEqualTo("Full-time");
        assertThat(created.get("employee").get("status").asText()).isEqualTo("active");
        assertThat(created.get("employee").get("salary").asInt()).isZero();
        assertThat(created.get("workplace").get("name").asText()).isEqualTo("Sri Sai Medicals");

        JsonNode second = created(owner, "Ravi Nair", "9886012346");
        assertThat(second.get("employee").get("id").asText()).isEqualTo("EMP-002");

        String reader = staff(owner, "9822000302", List.of("employees:read"));
        JsonNode list = get("/pharmacy/employees", reader);
        assertThat(list.get("employees")).hasSize(2);
        assertThat(list.get("employees").get(0).get("id").asText()).isEqualTo("EMP-001");

        ResponseEntity<JsonNode> denied = exchange(
                "/pharmacy/employees",
                reader,
                Map.of("name", "Nope", "phone", "9000000001", "position", "Cashier"),
                HttpMethod.POST);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().get("detail").asText()).isEqualTo("Employees cannot be created");

        String editor = staff(owner, "9822000303", List.of("employees:update"));
        ResponseEntity<JsonNode> inactive =
                exchange("/pharmacy/employees/EMP-001", editor, Map.of("status", "inactive"), HttpMethod.PATCH);
        assertThat(inactive.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(inactive.getBody().get("detail").asText()).isEqualTo("Employees cannot be set inactive");
        assertThat(get("/pharmacy/employees/EMP-001", owner)
                        .get("employee")
                        .get("status")
                        .asText())
                .isEqualTo("active");

        ResponseEntity<JsonNode> badFile = rest.exchange(
                "/pharmacy/employees", HttpMethod.POST, new HttpEntity<>(badDocument(), bearer(owner)), JsonNode.class);
        assertThat(badFile.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(badFile.getBody().get("detail").asText()).isEqualTo("File type is not allowed");
        assertThat(get("/pharmacy/employees", owner).get("employees")).hasSize(2);

        JsonNode otherSession = verify("9822000304", "pharmacy", "signup", false);
        String other = token(otherSession);
        approve(otherSession.get("account").get("pharmacyId").asText());
        assertThat(get("/pharmacy/employees", other).get("employees")).isEmpty();
        ResponseEntity<JsonNode> hidden = rest.exchange(
                "/pharmacy/employees/EMP-001", HttpMethod.GET, new HttpEntity<>(bearer(other)), JsonNode.class);
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(hidden.getBody().get("detail").asText()).isEqualTo("Employee was not found");
    }

    private JsonNode created(String token, String name, String phone) {
        ResponseEntity<JsonNode> response = exchange(
                "/pharmacy/employees",
                token,
                Map.of("name", name, "phone", phone, "position", "Pharmacist"),
                HttpMethod.POST);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody();
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

    private MultiValueMap<String, Object> badDocument() {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("name", "Bad File");
        body.add("phone", "9000000000");
        body.add("position", "Cashier");
        body.add("documentTypes", "Aadhaar card");
        HttpHeaders fileHeaders = new HttpHeaders();
        fileHeaders.setContentType(MediaType.TEXT_PLAIN);
        ByteArrayResource resource = new ByteArrayResource("hello".getBytes(StandardCharsets.UTF_8)) {
            @Override
            public String getFilename() {
                return "note.txt";
            }
        };
        body.add("documents", new HttpEntity<>(resource, fileHeaders));
        return body;
    }

    private void approve(String pharmacyId) {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute(
                    "UPDATE pharmacy SET verification_status = 'approved', name = 'Sri Sai Medicals' WHERE id = '"
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
