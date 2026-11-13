package com.medmate.server.stock;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.sms.RecordingSmsSender;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.ZoneId;
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
class PurchaseIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        StockDatabase.register(registry);
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
    void aBillPostsStockAndAReturnCanTakeOutstandingNegative() throws SQLException {
        JsonNode ownerSession = verify("9822000501", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        String pharmacyId = ownerSession.get("account").get("pharmacyId").asText();
        approve(pharmacyId);
        created(owner, "Bengaluru Pharma", "9886011111");

        String today = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        ResponseEntity<JsonNode> created = exchange(
                "/pharmacy/purchases",
                owner,
                Map.of(
                        "distributorId",
                        "DST-001",
                        "invoiceNo",
                        "INV-1",
                        "invoiceDate",
                        today,
                        "lines",
                        List.of(line("DR100", 2))),
                HttpMethod.POST);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode purchase = created.getBody().get("purchase");
        assertThat(purchase.get("id").asText()).isEqualTo("PUR-001");
        assertThat(purchase.get("ledgerAmount").asInt()).isEqualTo(21);
        assertThat(purchase.get("lines").get(0).get("name").asText()).isEqualTo("Crocin Advance");
        assertThat(get("/pharmacy/distributors/DST-001", owner)
                        .get("distributor")
                        .get("outstanding")
                        .asInt())
                .isEqualTo(21);
        assertThat(get("/pharmacy/inventory/DR100", owner)
                        .get("product")
                        .get("batches")
                        .get(0)
                        .get("qty")
                        .asInt())
                .isEqualTo(2);
        assertThat(get("/pharmacy/inventory/DR100", owner)
                        .get("product")
                        .get("reorderLevel")
                        .asInt())
                .isEqualTo(20);

        ResponseEntity<JsonNode> paid = exchange(
                "/pharmacy/distributors/DST-001/payments", owner, Map.of("amount", 21, "mode", "upi"), HttpMethod.POST);
        assertThat(paid.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<JsonNode> returned = exchange(
                "/pharmacy/purchases/PUR-001/returns",
                owner,
                Map.of("lines", List.of(Map.of("position", 0, "qty", 1, "freeQty", 0))),
                HttpMethod.POST);
        assertThat(returned.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(returned.getBody().get("purchase").get("id").asText()).isEqualTo("RET-001");
        assertThat(returned.getBody().get("purchase").get("ledgerAmount").asInt())
                .isEqualTo(11);
        assertThat(get("/pharmacy/distributors/DST-001", owner)
                        .get("distributor")
                        .get("outstanding")
                        .asInt())
                .isEqualTo(-11);
        assertThat(get("/pharmacy/inventory/DR100", owner)
                        .get("product")
                        .get("batches")
                        .get(0)
                        .get("qty")
                        .asInt())
                .isEqualTo(1);

        ResponseEntity<JsonNode> duplicate = exchange(
                "/pharmacy/purchases",
                owner,
                Map.of(
                        "distributorId",
                        "DST-001",
                        "invoiceNo",
                        "INV-1",
                        "invoiceDate",
                        today,
                        "lines",
                        List.of(line("DR100", 1))),
                HttpMethod.POST);
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(duplicate.getBody().get("detail").asText()).isEqualTo("Invoice number is already used");

        ResponseEntity<JsonNode> unknown = exchange(
                "/pharmacy/purchases",
                owner,
                Map.of(
                        "distributorId",
                        "DST-001",
                        "invoiceNo",
                        "INV-2",
                        "invoiceDate",
                        today,
                        "lines",
                        List.of(line("missing", 1))),
                HttpMethod.POST);
        assertThat(unknown.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(unknown.getBody().get("detail").asText()).isEqualTo("Product was not found");
        assertThat(get("/pharmacy/purchases", owner).get("purchases")).hasSize(2);

        String reader = staff(owner, "9822000502", List.of("purchases:read"));
        assertThat(get("/pharmacy/purchases", reader).get("purchases")).hasSize(2);
        JsonNode first = get("/pharmacy/purchases?page=1&size=1", reader);
        JsonNode second = get("/pharmacy/purchases?page=2&size=1", reader);
        assertThat(first.get("purchases")).hasSize(1);
        assertThat(first.get("total").asInt()).isEqualTo(2);
        assertThat(second.get("purchases")).hasSize(1);
        assertThat(second.get("purchases").get(0).get("id").asText())
                .isNotEqualTo(first.get("purchases").get(0).get("id").asText());
        assertThat(second.get("stats").get("purchaseCount").asInt())
                .isEqualTo(first.get("stats").get("purchaseCount").asInt());
        ResponseEntity<JsonNode> denied = exchange(
                "/pharmacy/purchases",
                reader,
                Map.of(
                        "distributorId",
                        "DST-001",
                        "invoiceNo",
                        "INV-3",
                        "invoiceDate",
                        today,
                        "lines",
                        List.of(line("DR100", 1))),
                HttpMethod.POST);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        JsonNode otherSession = verify("9822000503", "pharmacy", "signup", false);
        String other = token(otherSession);
        approve(otherSession.get("account").get("pharmacyId").asText());
        assertThat(get("/pharmacy/purchases", other).get("purchases")).isEmpty();
        assertThat(get("/pharmacy/inventory", other).get("products")).isEmpty();
        ResponseEntity<JsonNode> hidden = rest.exchange(
                "/pharmacy/purchases/PUR-001", HttpMethod.GET, new HttpEntity<>(bearer(other)), JsonNode.class);
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(hidden.getBody().get("detail").asText()).isEqualTo("Purchase was not found");
    }

    private static Map<String, Object> line(String productId, int qty) {
        return Map.of(
                "productId",
                productId,
                "batchNo",
                "B1",
                "expiry",
                "2027-06",
                "qty",
                qty,
                "freeQty",
                0,
                "rate",
                10.50,
                "mrp",
                18,
                "gst",
                0);
    }

    private JsonNode created(String token, String name, String phone) {
        ResponseEntity<JsonNode> response =
                exchange("/pharmacy/distributors", token, Map.of("name", name, "phone", phone), HttpMethod.POST);
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
