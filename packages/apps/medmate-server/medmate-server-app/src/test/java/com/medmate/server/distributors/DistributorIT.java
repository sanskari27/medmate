package com.medmate.server.distributors;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
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
class DistributorIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        DistributorDatabase.register(registry);
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
    void distributorsAreCodedScopedAndBalanced() throws SQLException {
        JsonNode ownerSession = verify("9822000401", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        String pharmacyId = ownerSession.get("account").get("pharmacyId").asText();
        approve(pharmacyId);

        JsonNode created = created(owner, "Bengaluru Pharma", "9886011111", 10000);
        JsonNode first = created.get("distributor");
        assertThat(first.get("id").asText()).isEqualTo("DST-001");
        assertThat(first.get("paymentTerms").asText()).isEqualTo("30 days credit");
        assertThat(first.get("active").asBoolean()).isTrue();
        assertThat(first.get("showInPurchases").asBoolean()).isTrue();
        assertThat(first.get("openingBalance").asInt()).isEqualTo(10000);
        assertThat(first.get("outstanding").asInt()).isEqualTo(10000);

        JsonNode second = created(owner, "Apollo Wholesale", "9886012222", 0);
        assertThat(second.get("distributor").get("id").asText()).isEqualTo("DST-002");

        String reader = staff(owner, "9822000402", List.of("distributors:read"));
        JsonNode list = get("/pharmacy/distributors", reader);
        assertThat(list.get("distributors")).hasSize(2);
        assertThat(list.get("distributors").get(0).get("id").asText()).isEqualTo("DST-001");
        assertThat(list.get("distributors").get(0).has("transactions")).isFalse();

        ResponseEntity<JsonNode> denied = exchange(
                "/pharmacy/distributors", reader, Map.of("name", "Nope", "phone", "9000000001"), HttpMethod.POST);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().get("detail").asText()).isEqualTo("Distributors cannot be created");

        purchase(pharmacyId, 5000);
        JsonNode afterBill = get("/pharmacy/distributors/DST-001", owner).get("distributor");
        assertThat(afterBill.get("outstanding").asInt()).isEqualTo(15000);
        assertThat(afterBill.get("transactions").get(0).get("type").asText()).isEqualTo("purchase");

        ResponseEntity<JsonNode> paid = exchange(
                "/pharmacy/distributors/DST-001/payments",
                owner,
                Map.of("amount", 2000, "mode", "upi", "note", "Part payment"),
                HttpMethod.POST);
        assertThat(paid.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(paid.getBody().get("distributor").get("outstanding").asInt()).isEqualTo(13000);
        JsonNode payments = get("/pharmacy/distributors/DST-001/payments", reader);
        assertThat(payments.get("total").asInt()).isEqualTo(2);
        assertThat(payments.get("payments").get(0).get("type").asText()).isEqualTo("purchase");
        assertThat(payments.get("payments").get(1).get("type").asText()).isEqualTo("payment");

        ResponseEntity<JsonNode> locked =
                exchange("/pharmacy/distributors/DST-001", owner, Map.of("openingBalance", 9000), HttpMethod.PATCH);
        assertThat(locked.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(locked.getBody().get("detail").asText()).isEqualTo("Opening balance is locked");
        assertThat(get("/pharmacy/distributors/DST-001", owner)
                        .get("distributor")
                        .get("openingBalance")
                        .asInt())
                .isEqualTo(10000);

        JsonNode otherSession = verify("9822000403", "pharmacy", "signup", false);
        String other = token(otherSession);
        approve(otherSession.get("account").get("pharmacyId").asText());
        assertThat(get("/pharmacy/distributors", other).get("distributors")).isEmpty();
        ResponseEntity<JsonNode> hidden = rest.exchange(
                "/pharmacy/distributors/DST-001", HttpMethod.GET, new HttpEntity<>(bearer(other)), JsonNode.class);
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(hidden.getBody().get("detail").asText()).isEqualTo("Distributor was not found");
    }

    private void purchase(String pharmacyId, int amount) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute(
                    "INSERT INTO distributor_transaction (pharmacy_id, distributor_code, code, type, amount, reference, note, recorded_at) "
                            + "VALUES ('"
                            + pharmacyId
                            + "', 'DST-001', 'TXN-001', 'purchase', "
                            + amount
                            + ", 'BILL-1', 'Opening stock', now())");
        }
    }

    private JsonNode created(String token, String name, String phone, int opening) {
        ResponseEntity<JsonNode> response = exchange(
                "/pharmacy/distributors",
                token,
                Map.of("name", name, "phone", phone, "openingBalance", opening),
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
