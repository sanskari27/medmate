package com.medmate.server.wards;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.sms.RecordingSmsSender;
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
class WardsFlowIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        WardDatabase.register(registry);
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
    void hospitalWardAdmitsTransfersAndDischarges() {
        JsonNode ownerSession = verify("9822000601", "pharmacy");
        String owner = token(ownerSession);
        approve(ownerSession.get("account").get("pharmacyId").asText(), "hospital");

        ResponseEntity<JsonNode> created = exchange(
                "/pharmacy/wards", owner, ward("Orthopaedic Ward", "ort", 10, "1000.00", 2, false), HttpMethod.POST);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode ward = created.getBody().get("ward");
        assertThat(ward.get("code").asText()).isEqualTo("ORT");
        assertThat(ward.get("dailyRate").asText()).isEqualTo("1000.00");
        assertThat(ward.get("bedsHeld").asInt()).isEqualTo(2);
        String wardId = ward.get("id").asText();

        ResponseEntity<JsonNode> held =
                exchange("/pharmacy/admissions", owner, admit(wardId, "ORT-9", "UHID-1"), HttpMethod.POST);
        assertThat(held.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(held.getBody().get("detail").asText()).isEqualTo("Bed is held for maintenance");

        ResponseEntity<JsonNode> admitted =
                exchange("/pharmacy/admissions", owner, admit(wardId, "ORT-1", "UHID-1"), HttpMethod.POST);
        assertThat(admitted.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String admissionId = admitted.getBody().get("admission").get("id").asText();
        assertThat(admitted.getBody().get("admission").get("outstanding").asText())
                .isEqualTo("1000.00");
        assertThat(admitted.getBody().get("admission").get("days").asInt()).isEqualTo(1);

        ResponseEntity<JsonNode> duplicate =
                exchange("/pharmacy/admissions", owner, admit(wardId, "ORT-2", "uhid-1"), HttpMethod.POST);
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(duplicate.getBody().get("detail").asText()).isEqualTo("This patient is already admitted");

        ResponseEntity<JsonNode> moved = exchange(
                "/pharmacy/admissions/" + admissionId + "/transfer",
                owner,
                Map.of("wardId", wardId, "bed", "ORT-2"),
                HttpMethod.POST);
        assertThat(moved.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(moved.getBody().get("admission").get("bed").asText()).isEqualTo("ORT-2");

        ResponseEntity<JsonNode> discharged = exchange(
                "/pharmacy/admissions/" + admissionId + "/discharge",
                owner,
                Map.of("payMode", "cash"),
                HttpMethod.POST);
        assertThat(discharged.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(discharged.getBody().get("admission").get("status").asText()).isEqualTo("discharged");
        assertThat(discharged.getBody().get("admission").get("outstanding").asText())
                .isEqualTo("1000.00");
        assertThat(get("/pharmacy/admissions", owner).get("admissions")).isEmpty();

        String reader = staff(owner, "9822000602", List.of("wards:read"));
        assertThat(get("/pharmacy/wards", reader).get("wards")).hasSize(1);
        ResponseEntity<JsonNode> denied =
                exchange("/pharmacy/admissions", reader, admit(wardId, "ORT-3", "UHID-2"), HttpMethod.POST);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().get("detail").asText()).isEqualTo("A patient cannot be admitted");

        JsonNode retailSession = verify("9822000603", "pharmacy");
        String retail = token(retailSession);
        approve(retailSession.get("account").get("pharmacyId").asText(), "pharmacy");
        ResponseEntity<JsonNode> hidden =
                exchange("/pharmacy/wards", retail, ward("General", "GEN", 4, "0.00", 0, false), HttpMethod.POST);
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(hidden.getBody().get("detail").asText()).isEqualTo("Wards are only available for a hospital");
    }

    private Map<String, Object> ward(String name, String code, int beds, String rate, int held, boolean maintenance) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        body.put("code", code);
        body.put("floor", "3rd floor");
        body.put("category", "Surgical");
        body.put("beds", beds);
        body.put("sister", "Sr. Meena");
        body.put("dailyRate", rate);
        body.put("bedsHeld", held);
        body.put("underMaintenance", maintenance);
        return body;
    }

    private Map<String, Object> admit(String wardId, String bed, String uhid) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", "Asha Rao");
        body.put("uhid", uhid);
        body.put("wardId", wardId);
        body.put("bed", bed);
        body.put("payerType", "self");
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

    private JsonNode verify(String phone, String type) {
        ResponseEntity<JsonNode> sent = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("phone", phone, "accountType", type, "purpose", "signup"), json()),
                JsonNode.class);
        assertThat(sent.getStatusCode()).isEqualTo(HttpStatus.OK);
        String code = sms.latestCode("+91" + phone);
        assertThat(code).isNotBlank();
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/otp/verify",
                HttpMethod.POST,
                new HttpEntity<>(
                        Map.of("phone", phone, "accountType", type, "purpose", "signup", "code", code), json()),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
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
