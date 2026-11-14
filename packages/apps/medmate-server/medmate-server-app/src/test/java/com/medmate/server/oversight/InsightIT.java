package com.medmate.server.oversight;

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
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("identity-it")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class InsightIT {

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
    void anAdminSeesFleetAndPharmacyActivityFromPostedRows() throws SQLException {
        JsonNode ownerSession = verify("9822004911", "pharmacy", "signup");
        String owner = token(ownerSession);
        String pharmacyId = ownerSession.get("account").get("pharmacyId").asText();
        approve(pharmacyId);
        stock(pharmacyId);
        ResponseEntity<JsonNode> sale = exchange(
                "/pharmacy/bills",
                owner,
                Map.of(
                        "patientName",
                        "Ada",
                        "patientPhone",
                        "9886012345",
                        "payMode",
                        "cash",
                        "lines",
                        List.of(Map.of("productId", "med-a", "batchNo", "B1", "qty", 1))),
                HttpMethod.POST);
        assertThat(sale.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        bootstrap("9822004912");
        String admin = token(verify("9822004912", "admin", "login"));
        ResponseEntity<JsonNode> refused =
                rest.exchange("/pharmacy-insights", HttpMethod.GET, new HttpEntity<>(bearer(owner)), JsonNode.class);
        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(refused.getBody().get("detail").asText()).isEqualTo("Pharmacy insights are not available");

        JsonNode fleet = get("/pharmacy-insights", admin);
        assertThat(fleet.get("total").asInt()).isEqualTo(1);
        assertThat(fleet.get("status").get("approved").asInt()).isEqualTo(1);
        assertThat(fleet.get("rankingRange").asText()).isEqualTo("30d");
        assertThat(fleet.get("rankings").get("sales").get(0).get("value").asText())
                .isEqualTo("30.00");
        assertThat(fleet.get("dormant").get("total").asInt()).isZero();

        JsonNode one = get("/pharmacy-insights/" + pharmacyId + "?range=30d", admin);
        assertThat(one.get("commercial").get("today").get("bills").asInt()).isEqualTo(1);
        assertThat(one.get("commercial").get("today").get("netSales").asText()).isEqualTo("30.00");
        assertThat(one.get("commercial").get("window").get("units").asInt()).isEqualTo(1);
        assertThat(one.get("stock").get("products").asInt()).isEqualTo(1);
        assertThat(one.get("people").get("patients").get("buyers").asInt()).isEqualTo(1);
        assertThat(one.get("cases")).isEmpty();

        JsonNode detail = get("/pharmacy-owners/" + pharmacyId, admin);
        assertThat(detail.get("createdAt").asText()).isNotBlank();
        assertThat(detail.get("extraDetails").isArray()).isTrue();
        assertThat(detail.get("reviews").isArray()).isTrue();
        assertThat(detail.get("blockHistory").isArray()).isTrue();
        assertThat(detail.get("pharmacyId").asText()).isEqualTo(pharmacyId);
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
        }
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

    private void bootstrap(String phone) {
        HttpHeaders headers = json();
        headers.setBearerAuth("test-bootstrap");
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/admin-bootstrap",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("phone", phone), headers),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
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

    private JsonNode verify(String phone, String type, String purpose) {
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
