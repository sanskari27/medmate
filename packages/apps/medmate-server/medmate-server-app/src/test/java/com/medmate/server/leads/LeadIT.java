package com.medmate.server.leads;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
class LeadIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        LeadDatabase.register(registry);
    }

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private com.medmate.server.identity.sms.RecordingSmsSender sms;

    @Autowired
    private javax.sql.DataSource dataSource;

    @BeforeEach
    void reset() throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("TRUNCATE account, otp_challenge, website_leads CASCADE");
        }
        sms.clear();
    }

    @Test
    void aPublicFormIsPagedFilteredAndMarked() {
        JsonNode created = created(contact(1));
        assertThat(created.get("lead").get("status").asText()).isEqualTo("new");
        assertThat(created.get("lead").get("site").asText()).isEqualTo("nammamedmate");
        String leadId = created.get("lead").get("id").asText();

        ResponseEntity<JsonNode> honeypot =
                rest.exchange("/api/v1/leads", HttpMethod.POST, new HttpEntity<>(honeypot(), json()), JsonNode.class);
        assertThat(honeypot.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<JsonNode> invalid =
                rest.exchange("/api/v1/leads", HttpMethod.POST, new HttpEntity<>(Map.of(), json()), JsonNode.class);
        assertThat(invalid.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(invalid.getBody().get("detail").asText()).isEqualTo("Lead is not valid");

        ResponseEntity<JsonNode> anonymous =
                rest.exchange("/api/v1/leads", HttpMethod.GET, new HttpEntity<>(json()), JsonNode.class);
        assertThat(anonymous.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(anonymous.getBody().get("detail").asText()).isEqualTo("This action is not allowed.");

        String admin = token(verify("9822001901", "admin", "login", true));
        String support = tokenForStaff(admin, "9822001902");
        JsonNode ownerSession = verify("9822001903", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        approve(ownerSession.get("account").get("pharmacyId").asText());
        ResponseEntity<JsonNode> ownerList =
                rest.exchange("/api/v1/leads", HttpMethod.GET, new HttpEntity<>(bearer(owner)), JsonNode.class);
        assertThat(ownerList.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        for (int index = 2; index <= 25; index++) {
            created(contact(index));
        }
        created(partner());

        JsonNode first = get("/api/v1/leads?page=1&size=25", admin);
        assertThat(first.get("leads")).hasSize(25);
        assertThat(first.get("total").asInt()).isEqualTo(26);
        assertThat(first.get("page").asInt()).isEqualTo(1);
        JsonNode second = get("/api/v1/leads?page=2&size=25", admin);
        assertThat(second.get("leads")).hasSize(1);
        assertThat(second.get("total").asInt()).isEqualTo(26);

        JsonNode pharmacy = get("/api/v1/leads?site=medmatepharmacy", support);
        assertThat(pharmacy.get("total").asInt()).isEqualTo(1);
        assertThat(pharmacy.get("leads").get(0).get("type").asText()).isEqualTo("pharmacy-partner");

        ResponseEntity<JsonNode> badStatus = rest.exchange(
                "/api/v1/leads?status=nope", HttpMethod.GET, new HttpEntity<>(bearer(admin)), JsonNode.class);
        assertThat(badStatus.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(badStatus.getBody().get("detail").asText()).isEqualTo("Status is not valid");
        ResponseEntity<JsonNode> badPage = rest.exchange(
                "/api/v1/leads?size=101", HttpMethod.GET, new HttpEntity<>(bearer(admin)), JsonNode.class);
        assertThat(badPage.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);

        JsonNode contacted = patch(leadId, support, "contacted");
        assertThat(contacted.get("lead").get("status").asText()).isEqualTo("contacted");
        assertThat(contacted.get("lead").get("message").asText()).isEqualTo("Need help");
        JsonNode fresh = patch(leadId, admin, "new");
        assertThat(fresh.get("lead").get("status").asText()).isEqualTo("new");

        ResponseEntity<JsonNode> missing = rest.exchange(
                "/api/v1/leads/00000000-0000-4000-8000-000000000299",
                HttpMethod.GET,
                new HttpEntity<>(bearer(admin)),
                JsonNode.class);
        assertThat(missing.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(missing.getBody().get("detail").asText()).isEqualTo("Lead was not found");
    }

    private JsonNode created(Map<String, Object> body) {
        ResponseEntity<JsonNode> response =
                rest.exchange("/api/v1/leads", HttpMethod.POST, new HttpEntity<>(body, json()), JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody();
    }

    private JsonNode get(String path, String token) {
        ResponseEntity<JsonNode> response =
                rest.exchange(path, HttpMethod.GET, new HttpEntity<>(bearer(token)), JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private JsonNode patch(String id, String token, String status) {
        ResponseEntity<JsonNode> response = rest.exchange(
                "/api/v1/leads/" + id,
                HttpMethod.PATCH,
                new HttpEntity<>(Map.of("status", status), bearer(token)),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
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

    private String tokenForStaff(String adminToken, String phone) {
        ResponseEntity<JsonNode> created = rest.exchange(
                "/staff",
                HttpMethod.POST,
                new HttpEntity<>(
                        Map.of("phone", phone, "displayName", "Nia", "subtypes", List.of("support")),
                        bearer(adminToken)),
                JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return token(verify(phone, "staff", "login", false));
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

    private static Map<String, Object> contact(int index) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("site", "nammamedmate");
        body.put("type", "contact");
        body.put("name", "Ada " + index);
        body.put("email", "ada" + index + "@example.com");
        body.put("subject", "Order issue");
        body.put("message", "Need help");
        return body;
    }

    private static Map<String, Object> partner() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("site", "medmatepharmacy");
        body.put("type", "pharmacy-partner");
        body.put("name", "Owner");
        body.put("phone", "9845012345");
        body.put("pharmacyName", "Sri Sai");
        body.put("area", "Jayanagar");
        body.put("city", "Bengaluru");
        body.put("plan", "Essential");
        body.put("preferredTime", "WhatsApp video call");
        body.put("consent", true);
        return body;
    }

    private static Map<String, Object> honeypot() {
        Map<String, Object> body = contact(99);
        body.put("companyWebsite", "https://spam.example");
        return body;
    }

    private static String token(JsonNode session) {
        return session.get("accessToken").asText();
    }

    private static HttpHeaders bearer(String token) {
        HttpHeaders headers = json();
        headers.setBearerAuth(token);
        return headers;
    }

    private static HttpHeaders json() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
