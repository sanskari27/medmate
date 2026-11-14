package com.medmate.server.prep;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.beans.factory.annotation.Qualifier;
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
class PrepExportIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        PrepDatabase.register(registry);
    }

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private com.medmate.server.identity.sms.RecordingSmsSender sms;

    @Autowired
    private DataSource dataSource;

    @Autowired
    @Qualifier("catalogDataSource")
    private DataSource catalogDataSource;

    @BeforeEach
    void reset() throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("TRUNCATE account, otp_challenge CASCADE");
        }
        try (Connection connection = catalogDataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("TRUNCATE drugs, otc_fmcg CASCADE");
        }
        sms.clear();
    }

    @Test
    void draftStaysSavedUntilTheProductExistsAndTheCsvDownloads() {
        String admin = token(verify("9876500151"));
        JsonNode created = exchange(
                HttpMethod.POST, "/api/v1/inventory-prep", Map.of("name", "City opening"), admin, HttpStatus.CREATED);
        String id = created.get("list").get("id").asText();
        assertThat(created.get("list").get("lineCount").asInt()).isZero();

        Map<String, Object> draft = new LinkedHashMap<>();
        draft.put("productId", "DR100");
        draft.put("productName", "Crocin, 500 mg");
        JsonNode saved = exchange(
                HttpMethod.PUT,
                "/api/v1/inventory-prep/" + id + "/lines",
                Map.of("lines", List.of(draft)),
                admin,
                HttpStatus.OK);
        assertThat(saved.get("list").get("lines").get(0).get("batchNo").isNull())
                .isTrue();

        JsonNode unfinished = exchange(
                HttpMethod.POST, "/api/v1/inventory-prep/" + id + "/export", null, admin, HttpStatus.BAD_REQUEST);
        assertThat(unfinished.get("detail").asText()).isEqualTo("Row 1: Batch number is required");

        Map<String, Object> complete = new LinkedHashMap<>();
        complete.put("productId", "DR100");
        complete.put("productName", "Crocin, 500 mg");
        complete.put("batchNo", "B1");
        complete.put("expiry", "2027-01");
        complete.put("qty", 10);
        complete.put("free", 0);
        complete.put("rate", 12.5);
        complete.put("mrp", 25);
        complete.put("gst", 12);
        exchange(
                HttpMethod.PUT,
                "/api/v1/inventory-prep/" + id + "/lines",
                Map.of("lines", List.of(complete)),
                admin,
                HttpStatus.OK);

        JsonNode missing = exchange(
                HttpMethod.POST, "/api/v1/inventory-prep/" + id + "/export", null, admin, HttpStatus.BAD_REQUEST);
        assertThat(missing.get("detail").asText()).isEqualTo("Row 1: Product was not found");

        exchange(HttpMethod.POST, "/api/v1/catalog/drugs", drug(), admin, HttpStatus.CREATED);

        ResponseEntity<String> csv = rest.exchange(
                "/api/v1/inventory-prep/" + id + "/export",
                HttpMethod.POST,
                new HttpEntity<>(bearer(admin)),
                String.class);
        assertThat(csv.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(csv.getHeaders().getContentType().toString()).contains("text/csv");
        assertThat(csv.getBody())
                .isEqualTo(
                        """
                        product_id,product_name,batch_no,expiry,qty,free,rate,mrp,gst
                        DR100,"Crocin, 500 mg",B1,2027-01,10,0,12.50,25.00,12
                        """);

        exchange(
                HttpMethod.PUT,
                "/api/v1/inventory-prep/" + id + "/lines",
                Map.of("lines", List.of(complete)),
                admin,
                HttpStatus.OK);
    }

    private JsonNode exchange(
            HttpMethod method, String path, Map<String, Object> body, String token, HttpStatus status) {
        HttpHeaders headers = bearer(token);
        HttpEntity<?> entity = body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);
        ResponseEntity<JsonNode> response = rest.exchange(path, method, entity, JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(status);
        return response.getBody();
    }

    private static Map<String, Object> drug() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("productId", "DR100");
        body.put("productName", "Crocin Advance");
        body.put("marketerName", "GSK");
        body.put("prescriptionRequired", false);
        body.put("package", "Strip");
        body.put("mrp", 25);
        body.put(
                "ingredients",
                List.of(
                        Map.of("name", "Paracetamol", "strength", "500 mg"),
                        Map.of("name", "Caffeine", "strength", "20 mg")));
        return body;
    }

    private JsonNode verify(String phone) {
        HttpHeaders headers = json();
        headers.setBearerAuth("test-bootstrap");
        ResponseEntity<JsonNode> created = rest.exchange(
                "/auth/admin-bootstrap",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("phone", phone), headers),
                JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.OK);
        String code = send(phone);
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/otp/verify",
                HttpMethod.POST,
                new HttpEntity<>(
                        Map.of("phone", phone, "accountType", "admin", "purpose", "login", "code", code), json()),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private String send(String phone) {
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("phone", phone, "accountType", "admin", "purpose", "login"), json()),
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
