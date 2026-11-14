package com.medmate.server.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import java.sql.Connection;
import java.sql.ResultSet;
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
class CatalogIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        CatalogDatabase.register(registry);
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
    void schemaSearchCreateAndIngredientReplacement() throws Exception {
        try (Connection connection = catalogDataSource.getConnection();
                Statement statement = connection.createStatement();
                ResultSet tables = statement.executeQuery(
                        "SELECT to_regclass('public.drugs'), to_regclass('public.drugs_product_name_trgm')")) {
            assertThat(tables.next()).isTrue();
            assertThat(tables.getString(1)).isEqualTo("drugs");
            assertThat(tables.getString(2)).isEqualTo("drugs_product_name_trgm");
        }

        ResponseEntity<JsonNode> empty =
                rest.exchange("/api/search?q=crocin", HttpMethod.GET, new HttpEntity<>(json()), JsonNode.class);
        assertThat(empty.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(empty.getBody().get("drug")).isEmpty();
        assertThat(empty.getBody().get("fmcg")).isEmpty();

        ResponseEntity<JsonNode> shortQuery =
                rest.exchange("/api/search?q=a", HttpMethod.GET, new HttpEntity<>(json()), JsonNode.class);
        assertThat(shortQuery.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(shortQuery.getBody().get("detail").asText()).isEqualTo("Query is not valid");

        ResponseEntity<JsonNode> anonymous = rest.exchange(
                "/api/v1/catalog/drugs",
                HttpMethod.POST,
                new HttpEntity<>(drug("Paracetamol", "Caffeine"), json()),
                JsonNode.class);
        assertThat(anonymous.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(anonymous.getBody().get("detail").asText()).isEqualTo("This action is not allowed.");

        String admin = token(verify("9822001701"));
        JsonNode created = exchange(
                HttpMethod.POST, "/api/v1/catalog/drugs", drug("Paracetamol", "Caffeine"), admin, HttpStatus.CREATED);
        assertThat(created.get("drug").get(0).get("productId").asText()).isEqualTo("DR100");
        assertThat(created.get("drug").get(0).get("package").asText()).isEqualTo("Strip");
        assertThat(created.get("drug")
                        .get(0)
                        .get("ingredients")
                        .get(0)
                        .get("name")
                        .asText())
                .isEqualTo("Paracetamol");
        assertThat(created.get("fmcg")).isEmpty();

        JsonNode found = exchange(HttpMethod.GET, "/api/search?q=crocin&limit=2", null, null, HttpStatus.OK);
        assertThat(found.get("drug")).hasSize(1);
        assertThat(found.get("drug").get(0).get("productName").asText()).isEqualTo("Crocin Advance");

        JsonNode page = exchange(HttpMethod.GET, "/api/products?ids=DR100,missing", null, null, HttpStatus.OK);
        assertThat(page.get("missing").get(0).asText()).isEqualTo("missing");
        assertThat(page.get("drug")).hasSize(1);

        ResponseEntity<JsonNode> duplicate = rest.exchange(
                "/api/v1/catalog/drugs",
                HttpMethod.POST,
                new HttpEntity<>(drug("Paracetamol", "Caffeine"), bearer(admin)),
                JsonNode.class);
        assertThat(duplicate.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(duplicate.getBody().get("detail").asText()).isEqualTo("Product already exists");

        JsonNode updated = exchange(
                HttpMethod.PUT, "/api/v1/catalog/drugs/DR100", drug("Ibuprofen", "Paracetamol"), admin, HttpStatus.OK);
        assertThat(names(updated.get("drug").get(0).get("ingredients"))).containsExactly("Ibuprofen", "Paracetamol");

        JsonNode read = exchange(HttpMethod.GET, "/api/products/DR100", null, null, HttpStatus.OK);
        assertThat(names(read.get("drug").get(0).get("ingredients"))).containsExactly("Ibuprofen", "Paracetamol");

        ResponseEntity<JsonNode> missing =
                rest.exchange("/api/products/does-not-exist", HttpMethod.GET, new HttpEntity<>(json()), JsonNode.class);
        assertThat(missing.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(missing.getBody().get("detail").asText()).isEqualTo("Product was not found");
        assertThat(missing.getBody().get("drug")).isEmpty();
        assertThat(missing.getBody().get("fmcg")).isEmpty();
    }

    private JsonNode exchange(
            HttpMethod method, String path, Map<String, Object> body, String token, HttpStatus status) {
        HttpHeaders headers = token == null ? json() : bearer(token);
        HttpEntity<?> entity = body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);
        ResponseEntity<JsonNode> response = rest.exchange(path, method, entity, JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(status);
        return response.getBody();
    }

    private static List<String> names(JsonNode ingredients) {
        return List.of(
                ingredients.get(0).get("name").asText(),
                ingredients.get(1).get("name").asText());
    }

    private static Map<String, Object> drug(String first, String second) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("productId", "DR100");
        body.put("productName", "Crocin Advance");
        body.put("marketerName", "GSK");
        body.put("prescriptionRequired", false);
        body.put("package", "Strip");
        body.put("mrp", 25);
        body.put(
                "ingredients",
                List.of(Map.of("name", first, "strength", "500 mg"), Map.of("name", second, "strength", "20 mg")));
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
