package com.medmate.server.billing;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.sms.RecordingSmsSender;
import java.sql.Connection;
import java.sql.ResultSet;
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
class BillIT {

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
    void aCashSaleNumbersTheBillReducesStockAndRefusesTheRest() throws SQLException {
        JsonNode ownerSession = verify("9822000801", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        String pharmacyId = ownerSession.get("account").get("pharmacyId").asText();
        approve(pharmacyId);
        stock(pharmacyId);

        JsonNode first = created(owner, sale("Ada", "9886012345", "cash", "med-a", "B1", 2, null, null));
        assertThat(first.get("number").asText()).isEqualTo("INV-0001");
        assertThat(first.get("payMode").asText()).isEqualTo("cash");
        assertThat(first.get("lines").get(0).get("offerId").asText()).isEqualTo("OFR-002");
        assertThat(first.get("discount").asText()).isEqualTo("12.00");
        assertThat(first.get("payable").asText()).isEqualTo("48.00");
        assertThat(onHand(pharmacyId, "med-a", "B1")).isEqualTo(3);

        String reader = staff(owner, "9822000802", List.of("billing:read"));
        ResponseEntity<JsonNode> denied =
                exchange(reader, sale("Ada", "9886012345", "cash", "med-a", "B1", 1, null, null));
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().get("detail").asText()).isEqualTo("Bills cannot be created");

        String cashier = staff(owner, "9822000803", List.of("billing:create"));
        JsonNode second = created(cashier, sale("Bea", "9886012346", "cash", "med-a", "B1", 1, null, null));
        assertThat(second.get("number").asText()).isEqualTo("INV-0002");
        assertThat(onHand(pharmacyId, "med-a", "B1")).isEqualTo(2);

        ResponseEntity<JsonNode> prescription =
                exchange(owner, sale("Cara", "9886012347", "cash", "rx-a", "RX1", 1, "", ""));
        assertThat(prescription.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(prescription.getBody().get("detail").asText()).isEqualTo("Prescribed by is required");
        assertThat(onHand(pharmacyId, "rx-a", "RX1")).isEqualTo(4);

        ResponseEntity<JsonNode> upi = exchange(owner, sale("Ada", "9886012345", "upi", "med-a", "B1", 1, null, null));
        assertThat(upi.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(upi.getBody().get("detail").asText()).isEqualTo("Payment type is not available");
        assertThat(onHand(pharmacyId, "med-a", "B1")).isEqualTo(2);

        JsonNode otherSession = verify("9822000804", "pharmacy", "signup", false);
        String other = token(otherSession);
        String otherPharmacy = otherSession.get("account").get("pharmacyId").asText();
        approve(otherPharmacy);
        ResponseEntity<JsonNode> hidden =
                exchange(other, sale("Ada", "9886012345", "cash", "med-a", "B1", 1, null, null));
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(hidden.getBody().get("detail").asText()).isEqualTo("Batch was not found");
        assertThat(onHand(pharmacyId, "med-a", "B1")).isEqualTo(2);
    }

    private void stock(String pharmacyId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("UPDATE pharmacy SET invoice_prefix = 'INV-' WHERE id = '" + pharmacyId + "'");
            statement.execute(
                    "INSERT INTO inventory_product (pharmacy_id, product_id, name, composition, reorder_level, prescription_required) VALUES ('"
                            + pharmacyId
                            + "', 'med-a', 'Crocin Advance', 'Paracetamol', 20, false), ('"
                            + pharmacyId
                            + "', 'rx-a', 'Amoxicillin', 'Amoxicillin', 20, true)");
            statement.execute(
                    "INSERT INTO inventory_batch (pharmacy_id, product_id, batch_no, expiry, qty, rate, mrp, gst) VALUES ('"
                            + pharmacyId
                            + "', 'med-a', 'B1', '2027-06', 5, 10.00, 30.00, 12), ('"
                            + pharmacyId
                            + "', 'rx-a', 'RX1', '2027-08', 4, 8.00, 20.00, 12)");
            statement.execute(
                    "INSERT INTO offer (pharmacy_id, code, title, coupon, discount_type, discount_value, scope, product_id, active, created_at) VALUES ('"
                            + pharmacyId
                            + "', 'OFR-002', 'Six off', 'SIX', 'flat', 6.00, 'product', 'med-a', true, NOW()), ('"
                            + pharmacyId
                            + "', 'OFR-001', 'Ten percent', 'TEN', 'pct', 10.00, 'all', NULL, true, NOW())");
        }
    }

    private int onHand(String pharmacyId, String productId, String batchNo) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement();
                ResultSet rows = statement.executeQuery("SELECT qty FROM inventory_batch WHERE pharmacy_id = '"
                        + pharmacyId
                        + "' AND product_id = '"
                        + productId
                        + "' AND batch_no = '"
                        + batchNo
                        + "'")) {
            assertThat(rows.next()).isTrue();
            return rows.getInt("qty");
        }
    }

    private Map<String, Object> sale(
            String name,
            String phone,
            String payMode,
            String productId,
            String batchNo,
            int qty,
            String doctor,
            String prescription) {
        java.util.HashMap<String, Object> body = new java.util.HashMap<>();
        body.put("patientName", name);
        body.put("patientPhone", phone);
        body.put("payMode", payMode);
        body.put("prescribedBy", doctor);
        body.put("prescriptionNumber", prescription);
        body.put("lines", List.of(Map.of("productId", productId, "batchNo", batchNo, "qty", qty)));
        return body;
    }

    private JsonNode created(String token, Map<String, Object> body) {
        ResponseEntity<JsonNode> response = exchange(token, body);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody().get("bill");
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
                            + pharmacyId
                            + "'");
        } catch (SQLException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private ResponseEntity<JsonNode> exchange(String token, Map<String, Object> body) {
        HttpHeaders headers = bearer(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange("/pharmacy/bills", HttpMethod.POST, new HttpEntity<>(body, headers), JsonNode.class);
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
