package com.medmate.server.crm;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.billing.BillDatabase;
import com.medmate.server.identity.sms.RecordingSmsSender;
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
class PatientIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        BillDatabase.register(registry);
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
    void creditCreatesAPatientAndAReturnLowersTheBalance() throws SQLException {
        JsonNode ownerSession = verify("9822001001", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        String pharmacyId = ownerSession.get("account").get("pharmacyId").asText();
        approve(pharmacyId);
        stock(pharmacyId);

        created(owner, sale("Ada", "9886012345", "credit"));
        String reader = staff(owner, "9822001002", List.of("patients:read"));
        String writer = staff(owner, "9822001003", List.of("patients:update"));

        ResponseEntity<JsonNode> hidden = get(writer, "/pharmacy/patients");
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        JsonNode list = get(reader, "/pharmacy/patients").getBody();
        assertThat(list.get("patients")).hasSize(1);
        assertThat(list.get("patients").get(0).get("name").asText()).isEqualTo("Ada");
        assertThat(list.get("patients").get(0).get("creditOutstanding").asText())
                .isEqualTo("24.00");
        assertThat(list.get("summary").get("chronic").asInt()).isEqualTo(0);

        ResponseEntity<JsonNode> exportDenied = get(reader, "/pharmacy/patients/export");
        assertThat(exportDenied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(exportDenied.getBody().get("detail").asText()).isEqualTo("Patients cannot be updated");

        JsonNode returned = createdReturn(owner, "INV-0001");
        assertThat(returned.get("amount").asText()).isEqualTo("24.00");
        JsonNode after = get(reader, "/pharmacy/patients/9886012345").getBody().get("patient");
        assertThat(after.get("outstanding").asText()).isEqualTo("0.00");

        ResponseEntity<JsonNode> over =
                post(writer, "/pharmacy/patients/9886012345/repayments", Map.of("amount", 1, "mode", "cash"));
        assertThat(over.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(over.getBody().get("detail").asText()).isEqualTo("Repayment is more than the balance");

        created(owner, sale("Ada", "9886012345", "credit"));
        JsonNode repayment = post(
                        writer, "/pharmacy/patients/9886012345/repayments", Map.of("amount", 10, "mode", "upi"))
                .getBody()
                .get("repayment");
        assertThat(repayment.get("code").asText()).isEqualTo("CR-001");

        JsonNode saved = patch(writer, "/pharmacy/patients/9886012345", Map.of("note", "morning dose", "consent", true))
                .getBody()
                .get("patient");
        assertThat(saved.get("profile").get("note").asText()).isEqualTo("morning dose");
        assertThat(saved.get("profile").get("consent").asBoolean()).isTrue();

        JsonNode otherSession = verify("9822001004", "pharmacy", "signup", false);
        String other = token(otherSession);
        approve(otherSession.get("account").get("pharmacyId").asText());
        ResponseEntity<JsonNode> missing = get(other, "/pharmacy/patients/9886012345");
        assertThat(missing.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(missing.getBody().get("detail").asText()).isEqualTo("Patient was not found");
        assertThat(get(other, "/pharmacy/patients").getBody().get("patients")).isEmpty();
    }

    private void stock(String pharmacyId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("UPDATE pharmacy SET invoice_prefix = 'INV-' WHERE id = '" + pharmacyId + "'");
            statement.execute(
                    "INSERT INTO inventory_product (pharmacy_id, product_id, name, composition, reorder_level, prescription_required) VALUES ('"
                            + pharmacyId + "', 'med-a', 'Crocin Advance', 'Paracetamol', 20, false)");
            statement.execute(
                    "INSERT INTO inventory_batch (pharmacy_id, product_id, batch_no, expiry, qty, rate, mrp, gst) VALUES ('"
                            + pharmacyId + "', 'med-a', 'B1', '2027-06', 8, 10.00, 30.00, 12)");
            statement.execute(
                    "INSERT INTO offer (pharmacy_id, code, title, coupon, discount_type, discount_value, scope, product_id, active, created_at) VALUES ('"
                            + pharmacyId
                            + "', 'OFR-002', 'Six off', 'SIX', 'flat', 6.00, 'product', 'med-a', true, NOW())");
        }
    }

    private Map<String, Object> sale(String name, String phone, String payMode) {
        return Map.of(
                "patientName",
                name,
                "patientPhone",
                phone,
                "payMode",
                payMode,
                "lines",
                List.of(Map.of("productId", "med-a", "batchNo", "B1", "qty", 1)));
    }

    private JsonNode created(String token, Map<String, Object> body) {
        ResponseEntity<JsonNode> response = post(token, "/pharmacy/bills", body);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody().get("bill");
    }

    private JsonNode createdReturn(String token, String number) {
        ResponseEntity<JsonNode> response = post(
                token,
                "/pharmacy/sales/" + number + "/returns",
                Map.of("lines", List.of(Map.of("position", 0, "qty", 1))));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody().get("sale");
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

    private void approve(String pharmacyId) {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute(
                    "UPDATE pharmacy SET verification_status = 'approved', name = 'Sri Sai Medicals' WHERE id = '"
                            + pharmacyId + "'");
        } catch (SQLException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private ResponseEntity<JsonNode> get(String token, String path) {
        return rest.exchange(path, HttpMethod.GET, new HttpEntity<>(bearer(token)), JsonNode.class);
    }

    private ResponseEntity<JsonNode> post(String token, String path, Map<String, Object> body) {
        HttpHeaders headers = bearer(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange(path, HttpMethod.POST, new HttpEntity<>(body, headers), JsonNode.class);
    }

    private ResponseEntity<JsonNode> patch(String token, String path, Map<String, Object> body) {
        HttpHeaders headers = bearer(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange(path, HttpMethod.PATCH, new HttpEntity<>(body, headers), JsonNode.class);
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
