package com.medmate.server.offers;

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
class OfferIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        OfferDatabase.register(registry);
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
    void offersAreCodedScopedAndCounted() throws SQLException {
        JsonNode ownerSession = verify("9822000701", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        String pharmacyId = ownerSession.get("account").get("pharmacyId").asText();
        approve(pharmacyId);
        stock(pharmacyId);

        JsonNode first = created(
                owner,
                Map.of(
                        "title",
                        "Monsoon Health Sale",
                        "code",
                        "namma25",
                        "type",
                        "pct",
                        "value",
                        10,
                        "scope",
                        "all",
                        "target",
                        "med-a"));
        assertThat(first.get("id").asText()).isEqualTo("OFR-001");
        assertThat(first.get("code").asText()).isEqualTo("NAMMA25");
        assertThat(first.get("scope").asText()).isEqualTo("all");
        assertThat(first.get("target").isNull()).isTrue();
        assertThat(first.get("active").asBoolean()).isTrue();
        assertThat(first.get("itemCount").asInt()).isEqualTo(2);

        JsonNode second = created(
                owner,
                Map.of(
                        "title",
                        "Crocin offer",
                        "code",
                        "crocin5",
                        "type",
                        "flat",
                        "value",
                        5,
                        "scope",
                        "product",
                        "target",
                        "med-a"));
        assertThat(second.get("id").asText()).isEqualTo("OFR-002");
        assertThat(second.get("itemCount").asInt()).isEqualTo(1);

        String reader = staff(owner, "9822000702", List.of("offers:read"));
        JsonNode list = get("/pharmacy/offers", reader);
        assertThat(list.get("offers").get(0).get("id").asText()).isEqualTo("OFR-002");
        assertThat(list.get("offers").get(1).get("id").asText()).isEqualTo("OFR-001");
        assertThat(list.get("products")).isNull();

        ResponseEntity<JsonNode> denied = exchange(
                "/pharmacy/offers",
                reader,
                Map.of("title", "Nope", "code", "NOPE", "type", "pct", "value", 5, "scope", "all"),
                HttpMethod.POST);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().get("detail").asText()).isEqualTo("Offers cannot be created");

        ResponseEntity<JsonNode> refused = exchange(
                "/pharmacy/offers",
                owner,
                Map.of(
                        "title",
                        "Missing",
                        "code",
                        "MISS",
                        "type",
                        "pct",
                        "value",
                        5,
                        "scope",
                        "product",
                        "target",
                        "med-missing"),
                HttpMethod.POST);
        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(refused.getBody().get("detail").asText()).isEqualTo("Product was not found");
        assertThat(get("/pharmacy/offers", owner).get("offers")).hasSize(2);

        ResponseEntity<JsonNode> updated = exchange(
                "/pharmacy/offers/OFR-001",
                owner,
                Map.of(
                        "title",
                        "Winter Sale",
                        "code",
                        "winter10",
                        "type",
                        "pct",
                        "value",
                        12,
                        "scope",
                        "all",
                        "active",
                        false),
                HttpMethod.PATCH);
        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode offer = updated.getBody().get("offer");
        assertThat(offer.get("title").asText()).isEqualTo("Winter Sale");
        assertThat(offer.get("code").asText()).isEqualTo("WINTER10");
        assertThat(offer.get("value").decimalValue()).isEqualByComparingTo("12");
        assertThat(offer.get("active").asBoolean()).isFalse();
        assertThat(offer.get("itemCount").asInt()).isEqualTo(2);

        ResponseEntity<String> deleted = rest.exchange(
                "/pharmacy/offers/OFR-002", HttpMethod.DELETE, new HttpEntity<>(bearer(owner)), String.class);
        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(get("/pharmacy/offers", owner).get("offers")).hasSize(1);

        JsonNode third =
                created(owner, Map.of("title", "Next", "code", "NEXT", "type", "flat", "value", 1, "scope", "all"));
        assertThat(third.get("id").asText()).isEqualTo("OFR-003");

        JsonNode otherSession = verify("9822000703", "pharmacy", "signup", false);
        String other = token(otherSession);
        approve(otherSession.get("account").get("pharmacyId").asText());
        assertThat(get("/pharmacy/offers", other).get("offers")).isEmpty();
        ResponseEntity<JsonNode> hidden =
                exchange("/pharmacy/offers/OFR-001", other, Map.of("title", "Stolen"), HttpMethod.PATCH);
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(hidden.getBody().get("detail").asText()).isEqualTo("Offer was not found");
        JsonNode remaining = get("/pharmacy/offers", owner).get("offers");
        assertThat(remaining).hasSize(2);
        assertThat(remaining.get(1).get("title").asText()).isEqualTo("Winter Sale");
    }

    private void stock(String pharmacyId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("INSERT INTO inventory_product (pharmacy_id, product_id, name, reorder_level) VALUES ('"
                    + pharmacyId
                    + "', 'med-a', 'Crocin Advance', 20), ('"
                    + pharmacyId
                    + "', 'med-b', 'Dolo 650', 20)");
        }
    }

    private JsonNode created(String token, Map<String, Object> body) {
        ResponseEntity<JsonNode> response = exchange("/pharmacy/offers", token, body, HttpMethod.POST);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody().get("offer");
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
