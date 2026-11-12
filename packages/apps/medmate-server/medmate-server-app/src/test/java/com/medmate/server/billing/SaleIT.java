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
class SaleIT {

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
    void aReturnRestoresStockAndALaterMonthMakesNetNegative() throws SQLException {
        JsonNode ownerSession = verify("9822000901", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        String pharmacyId = ownerSession.get("account").get("pharmacyId").asText();
        approve(pharmacyId);
        stock(pharmacyId);

        JsonNode bill = created(owner, sale("Ada", "9886012345", "med-a", "B1", 3));
        assertThat(bill.get("number").asText()).isEqualTo("INV-0001");
        assertThat(bill.get("payable").asText()).isEqualTo("72.00");
        backdate(pharmacyId, "INV-0001");
        assertThat(onHand(pharmacyId, "med-a", "B1")).isEqualTo(5);

        String reader = staff(owner, "9822000902", List.of("sales:read"));
        ResponseEntity<JsonNode> denied = post(
                reader, "/pharmacy/sales/INV-0001/returns", Map.of("lines", List.of(Map.of("position", 0, "qty", 1))));
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().get("detail").asText()).isEqualTo("Sales cannot be returned");

        JsonNode returned = createdReturn(owner, "INV-0001", 1);
        assertThat(returned.get("id").asText()).isEqualTo("RET-001");
        assertThat(returned.get("amount").asText()).isEqualTo("24.00");
        assertThat(returned.get("lines").get(0).get("name").asText()).isEqualTo("Crocin Advance");
        assertThat(onHand(pharmacyId, "med-a", "B1")).isEqualTo(6);
        assertThat(returnCount(pharmacyId)).isEqualTo(1);

        JsonNode opened = get(reader, "/pharmacy/sales/INV-0001").getBody().get("sale");
        assertThat(opened.get("lines").get(0).get("returnedQty").asInt()).isEqualTo(1);

        JsonNode list = get(reader, "/pharmacy/sales").getBody();
        assertThat(list.get("sales").get(0).get("id").asText()).isEqualTo("RET-001");
        assertThat(list.get("sales").get(1).get("id").asText()).isEqualTo("INV-0001");
        assertThat(list.get("sales").get(0).get("items").asInt()).isEqualTo(1);
        assertThat(list.get("sales").get(1).get("items").asInt()).isEqualTo(3);
        assertThat(list.get("stats").get("salesThisMonth").asText()).isEqualTo("0.00");
        assertThat(list.get("stats").get("saleCount").asInt()).isEqualTo(0);
        assertThat(list.get("stats").get("returnsThisMonth").asText()).isEqualTo("24.00");
        assertThat(list.get("stats").get("returnCount").asInt()).isEqualTo(1);
        assertThat(list.get("stats").get("netThisMonth").asText()).isEqualTo("-24.00");

        ResponseEntity<JsonNode> over = post(
                owner, "/pharmacy/sales/INV-0001/returns", Map.of("lines", List.of(Map.of("position", 0, "qty", 3))));
        assertThat(over.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(over.getBody().get("detail").asText()).isEqualTo("Return is more than the quantity sold");
        assertThat(onHand(pharmacyId, "med-a", "B1")).isEqualTo(6);
        assertThat(returnCount(pharmacyId)).isEqualTo(1);

        dropBatch(pharmacyId);
        ResponseEntity<JsonNode> missing = post(
                owner, "/pharmacy/sales/INV-0001/returns", Map.of("lines", List.of(Map.of("position", 0, "qty", 1))));
        assertThat(missing.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(missing.getBody().get("detail").asText()).isEqualTo("Batch was not found");
        assertThat(returnCount(pharmacyId)).isEqualTo(1);

        JsonNode otherSession = verify("9822000903", "pharmacy", "signup", false);
        String other = token(otherSession);
        approve(otherSession.get("account").get("pharmacyId").asText());
        ResponseEntity<JsonNode> hidden = get(other, "/pharmacy/sales/INV-0001");
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(hidden.getBody().get("detail").asText()).isEqualTo("Sale was not found");
        assertThat(get(other, "/pharmacy/sales").getBody().get("sales")).isEmpty();
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

    private void backdate(String pharmacyId, String number) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("UPDATE bill SET sold_at = '2026-10-15T08:00:00Z' WHERE pharmacy_id = '" + pharmacyId
                    + "' AND number = '" + number + "'");
        }
    }

    private void dropBatch(String pharmacyId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("DELETE FROM inventory_batch WHERE pharmacy_id = '" + pharmacyId + "'");
        }
    }

    private int onHand(String pharmacyId, String productId, String batchNo) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement();
                ResultSet rows = statement.executeQuery("SELECT qty FROM inventory_batch WHERE pharmacy_id = '"
                        + pharmacyId + "' AND product_id = '" + productId + "' AND batch_no = '" + batchNo + "'")) {
            assertThat(rows.next()).isTrue();
            return rows.getInt("qty");
        }
    }

    private int returnCount(String pharmacyId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement();
                ResultSet rows = statement.executeQuery(
                        "SELECT COUNT(*) FROM sale_return WHERE pharmacy_id = '" + pharmacyId + "'")) {
            assertThat(rows.next()).isTrue();
            return rows.getInt(1);
        }
    }

    private Map<String, Object> sale(String name, String phone, String productId, String batchNo, int qty) {
        return Map.of(
                "patientName",
                name,
                "patientPhone",
                phone,
                "payMode",
                "cash",
                "lines",
                List.of(Map.of("productId", productId, "batchNo", batchNo, "qty", qty)));
    }

    private JsonNode created(String token, Map<String, Object> body) {
        ResponseEntity<JsonNode> response = post(token, "/pharmacy/bills", body);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody().get("bill");
    }

    private JsonNode createdReturn(String token, String number, int qty) {
        ResponseEntity<JsonNode> response = post(
                token,
                "/pharmacy/sales/" + number + "/returns",
                Map.of("lines", List.of(Map.of("position", 0, "qty", qty))));
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
