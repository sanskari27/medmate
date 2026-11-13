package com.medmate.server.support;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
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
class SupportFlowIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        SupportDatabase.register(registry);
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
            statement.execute("TRUNCATE account, otp_challenge CASCADE");
            statement.execute(
                    """
                    DELETE FROM support_faq
                    WHERE id NOT IN (
                        '00000000-0000-4000-8000-000000000101',
                        '00000000-0000-4000-8000-000000000102',
                        '00000000-0000-4000-8000-000000000103',
                        '00000000-0000-4000-8000-000000000104',
                        '00000000-0000-4000-8000-000000000105',
                        '00000000-0000-4000-8000-000000000106'
                    )
                    """);
            statement.execute("UPDATE support_faq SET published = TRUE");
        }
        sms.clear();
    }

    @Test
    void aTicketIsClaimedRepliedResolvedAndAFaqCanBeHidden() {
        String admin = token(verify("9822000101", "admin", "login", true));
        String support = tokenForStaff(admin, "9822000102");
        JsonNode ownerSession = verify("9822000103", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        String pharmacyId = ownerSession.get("account").get("pharmacyId").asText();
        approve(pharmacyId);

        JsonNode faqs = get("/support/faqs", owner);
        assertThat(faqs.size()).isEqualTo(6);
        assertThat(faqs.get(0).get("question").asText()).isEqualTo("How do I add a new medicine to inventory?");

        JsonNode created = post(
                "/support/cases",
                owner,
                java.util.Map.of(
                        "kind",
                        "ticket",
                        "subject",
                        "GST rate",
                        "category",
                        "Billing",
                        "details",
                        "One line is wrong."));
        assertThat(created.get("category").asText()).isEqualTo("Billing");
        assertThat(created.get("status").asText()).isEqualTo("waiting");
        assertThat(created.get("ticketNumber").asText()).startsWith("TKT-");
        assertThat(created.get("messages")).hasSize(1);
        assertThat(created.get("messages").get(0).get("body").asText()).isEqualTo("One line is wrong.");
        String caseId = created.get("id").asText();
        JsonNode cases = get("/support/cases", owner);
        assertThat(cases.get("cases").findValuesAsText("id")).contains(caseId);
        assertThat(cases.get("page").asInt()).isEqualTo(1);
        assertThat(cases.get("total").asInt()).isGreaterThanOrEqualTo(1);

        JsonNode chat = post(
                "/support/cases",
                owner,
                java.util.Map.of("kind", "chat", "subject", "Need a person", "category", "Billing"));
        assertThat(chat.get("category").asText()).isEqualTo("Live chat");
        assertThat(chat.get("messages")).hasSize(0);

        JsonNode claimed = post("/support/cases/" + caseId + "/claim", support, java.util.Map.of());
        assertThat(claimed.get("status").asText()).isEqualTo("open");
        assertThat(claimed.get("assigneeName").asText()).isEqualTo("Nia");

        ResponseEntity<JsonNode> secondClaim =
                exchange("/support/cases/" + caseId + "/claim", support, java.util.Map.of(), HttpMethod.POST);
        assertThat(secondClaim.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        ResponseEntity<JsonNode> adminClaim =
                exchange("/support/cases/" + caseId + "/claim", admin, java.util.Map.of(), HttpMethod.POST);
        assertThat(adminClaim.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        JsonNode message = post(
                "/support/cases/" + caseId + "/messages", support, java.util.Map.of("text", "We corrected the slab."));
        assertThat(message.get("body").asText()).isEqualTo("We corrected the slab.");

        JsonNode resolved = post("/support/cases/" + caseId + "/resolve", owner, java.util.Map.of());
        assertThat(resolved.get("status").asText()).isEqualTo("resolved");
        assertThat(resolved.get("messages")).hasSize(2);

        ResponseEntity<JsonNode> late = exchange(
                "/support/cases/" + caseId + "/messages", owner, java.util.Map.of("text", "Thanks"), HttpMethod.POST);
        assertThat(late.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        String faqId = faqs.get(0).get("id").asText();
        ResponseEntity<JsonNode> hidden = exchange(
                "/support/faqs/" + faqId,
                support,
                java.util.Map.of(
                        "question",
                        faqs.get(0).get("question").asText(),
                        "answer",
                        faqs.get(0).get("answer").asText(),
                        "published",
                        false),
                HttpMethod.PATCH);
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(get("/support/faqs", owner).size()).isEqualTo(5);
        assertThat(get("/support/faqs", support).size()).isEqualTo(6);
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
                        java.util.Map.of("phone", phone, "displayName", "Nia", "subtypes", List.of("support")),
                        bearer(adminToken)),
                JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return token(verify(phone, "staff", "login", false));
    }

    private JsonNode get(String path, String token) {
        ResponseEntity<JsonNode> response =
                rest.exchange(path, HttpMethod.GET, new HttpEntity<>(bearer(token)), JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private JsonNode post(String path, String token, java.util.Map<String, Object> body) {
        ResponseEntity<JsonNode> response = exchange(path, token, body, HttpMethod.POST);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private ResponseEntity<JsonNode> exchange(
            String path, String token, java.util.Map<String, Object> body, HttpMethod method) {
        return rest.exchange(path, method, new HttpEntity<>(body, bearer(token)), JsonNode.class);
    }

    private JsonNode verify(String phone, String type, String purpose, boolean bootstrap) {
        if (bootstrap) {
            HttpHeaders headers = json();
            headers.setBearerAuth("test-bootstrap");
            ResponseEntity<JsonNode> created = rest.exchange(
                    "/auth/admin-bootstrap",
                    HttpMethod.POST,
                    new HttpEntity<>(java.util.Map.of("phone", phone), headers),
                    JsonNode.class);
            assertThat(created.getStatusCode()).isEqualTo(HttpStatus.OK);
        }
        String code = send(phone, type, purpose);
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/otp/verify",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", phone, "accountType", type, "purpose", purpose, "code", code),
                        json()),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private String send(String phone, String type, String purpose) {
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("phone", phone, "accountType", type, "purpose", purpose), json()),
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
