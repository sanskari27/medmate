package com.medmate.server.departments;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.sms.RecordingSmsSender;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("identity-it")
class DepartmentsFlowIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        DepartmentDatabase.register(registry);
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
    void hospitalDepartmentsKeepATreeAndStayHiddenFromRetail() {
        JsonNode ownerSession = verify("9822000501", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        approve(ownerSession.get("account").get("pharmacyId").asText(), "hospital");

        ResponseEntity<JsonNode> parent = exchange(
                "/pharmacy/departments", owner, department("Cardiology", "CARD", null, false, 2), HttpMethod.POST);
        assertThat(parent.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(parent.getBody().get("department").get("isActive").asBoolean())
                .isFalse();
        assertThat(parent.getBody().get("department").get("parent").isNull()).isTrue();
        String parentId = parent.getBody().get("department").get("id").asText();

        ResponseEntity<JsonNode> child = exchange(
                "/pharmacy/departments", owner, department("Echo", "ECHO", parentId, true, 1), HttpMethod.POST);
        assertThat(child.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(child.getBody().get("department").get("parent").get("code").asText())
                .isEqualTo("CARD");
        String childId = child.getBody().get("department").get("id").asText();

        JsonNode listed = get("/pharmacy/departments", owner).get("departments");
        assertThat(listed).hasSize(2);
        assertThat(listed.get(0).get("code").asText()).isEqualTo("ECHO");
        assertThat(listed.get(1).get("code").asText()).isEqualTo("CARD");

        ResponseEntity<JsonNode> renamed =
                exchange("/pharmacy/departments/" + childId, owner, Map.of("code", "ECHO-2"), HttpMethod.PATCH);
        assertThat(renamed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(renamed.getBody().get("department").get("code").asText()).isEqualTo("ECHO-2");

        ResponseEntity<JsonNode> duplicate = exchange(
                "/pharmacy/departments", owner, department("Echo lab", "echo-2", null, true, 0), HttpMethod.POST);
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(duplicate.getBody().get("detail").asText()).isEqualTo("Department code is already in use");
        assertThat(get("/pharmacy/departments", owner).get("departments")).hasSize(2);

        ResponseEntity<JsonNode> cycle = exchange(
                "/pharmacy/departments/" + childId, owner, Map.of("parentDepartmentId", childId), HttpMethod.PATCH);
        assertThat(cycle.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(cycle.getBody().get("detail").asText()).isEqualTo("Department cycle is not allowed");
        assertThat(get("/pharmacy/departments/" + childId, owner)
                        .get("department")
                        .get("code")
                        .asText())
                .isEqualTo("ECHO-2");
        assertThat(get("/pharmacy/departments/" + childId, owner)
                        .get("department")
                        .get("parent")
                        .get("id")
                        .asText())
                .isEqualTo(parentId);

        ResponseEntity<JsonNode> missingParent = exchange(
                "/pharmacy/departments",
                owner,
                department("Ward", "WARD", UUID.randomUUID().toString(), true, 0),
                HttpMethod.POST);
        assertThat(missingParent.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(missingParent.getBody().get("detail").asText()).isEqualTo("Parent department was not found");

        String reader = staff(owner, "9822000502", List.of("departments:read"));
        assertThat(get("/pharmacy/departments", reader).get("departments")).hasSize(2);
        ResponseEntity<JsonNode> denied =
                exchange("/pharmacy/departments", reader, department("Ward", "WARD", null, true, 0), HttpMethod.POST);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().get("detail").asText()).isEqualTo("Departments cannot be created");

        JsonNode retailSession = verify("9822000503", "pharmacy", "signup", false);
        String retail = token(retailSession);
        approve(retailSession.get("account").get("pharmacyId").asText(), "pharmacy");
        ResponseEntity<JsonNode> hidden = exchange(
                "/pharmacy/departments", retail, department("Outpatient", "OPD", null, true, 0), HttpMethod.POST);
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(hidden.getBody().get("detail").asText()).isEqualTo("Departments are only available for a hospital");
    }

    private Map<String, Object> department(String name, String code, String parentId, boolean active, int order) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        body.put("code", code);
        body.put("parentDepartmentId", parentId);
        body.put("isActive", active);
        body.put("displayOrder", order);
        return body;
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
