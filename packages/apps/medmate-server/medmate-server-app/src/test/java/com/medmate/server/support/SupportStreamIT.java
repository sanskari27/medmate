package com.medmate.server.support;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import java.net.URI;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("identity-it")
class SupportStreamIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        SupportDatabase.register(registry);
    }

    @LocalServerPort
    private int port;

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
        }
        sms.clear();
    }

    @Test
    void aBadTokenClosesTheSocketAndAReplyReachesTheOwner() throws Exception {
        Socket bad = open();
        bad.session.sendMessage(new TextMessage("{\"type\":\"auth\",\"accessToken\":\"not-a-token\"}"));
        assertThat(bad.closed.poll(3, TimeUnit.SECONDS)).isNotNull();

        String admin = token(verify("9822000201", "admin", "login", true));
        String support = tokenForStaff(admin, "9822000202");
        JsonNode ownerSession = verify("9822000203", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        approve(ownerSession.get("account").get("pharmacyId").asText());
        JsonNode created = post("/support/cases", owner, java.util.Map.of("kind", "chat", "subject", "Printer jam"));
        String caseId = created.get("id").asText();

        Socket ownerSocket = open();
        ownerSocket.session.sendMessage(new TextMessage("{\"type\":\"auth\",\"accessToken\":\"" + owner + "\"}"));
        assertThat(ownerSocket.messages.poll(3, TimeUnit.SECONDS)).contains("ready");

        post("/support/cases/" + caseId + "/messages", support, java.util.Map.of("text", "Try the side door."));
        assertThat(ownerSocket.messages.poll(3, TimeUnit.SECONDS)).contains("message.created");
        ownerSocket.session.close();
    }

    private Socket open() throws Exception {
        Socket socket = new Socket();
        socket.session = new StandardWebSocketClient()
                .execute(socket, null, URI.create("ws://127.0.0.1:" + port + "/support/stream"))
                .get(5, TimeUnit.SECONDS);
        return socket;
    }

    private void approve(String pharmacyId) {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute(
                    "UPDATE pharmacy SET verification_status = 'approved', name = 'Care Pharmacy' WHERE id = '"
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

    private JsonNode post(String path, String token, java.util.Map<String, Object> body) {
        ResponseEntity<JsonNode> response =
                rest.exchange(path, HttpMethod.POST, new HttpEntity<>(body, bearer(token)), JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private JsonNode verify(String phone, String type, String purpose, boolean bootstrap) {
        if (bootstrap) {
            HttpHeaders headers = json();
            headers.setBearerAuth("test-bootstrap");
            assertThat(rest.exchange(
                                    "/auth/admin-bootstrap",
                                    HttpMethod.POST,
                                    new HttpEntity<>(java.util.Map.of("phone", phone), headers),
                                    JsonNode.class)
                            .getStatusCode())
                    .isEqualTo(HttpStatus.OK);
        }
        ResponseEntity<JsonNode> sent = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("phone", phone, "accountType", type, "purpose", purpose), json()),
                JsonNode.class);
        assertThat(sent.getStatusCode()).isEqualTo(HttpStatus.OK);
        String code = sms.latestCode("+91" + phone);
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

    private static final class Socket extends TextWebSocketHandler {
        private WebSocketSession session;
        private final BlockingQueue<String> messages = new LinkedBlockingQueue<>();
        private final BlockingQueue<CloseStatus> closed = new LinkedBlockingQueue<>();

        @Override
        protected void handleTextMessage(WebSocketSession session, TextMessage message) {
            messages.add(message.getPayload());
        }

        @Override
        public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
            closed.add(status);
        }
    }
}
