package com.medmate.server.identity.sms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medmate.server.identity.otp.OtpPurpose;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClientResponseException;

class TelinfySmsSenderTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Test
    void sendsTheApprovedTemplateForEachPurpose() throws Exception {
        List<Captured> captured = new ArrayList<>();
        HttpServer server = server(200, captured);
        server.start();
        try {
            TelinfySmsSender sender = new TelinfySmsSender("test-key", baseUrl(server));

            sender.send("+919876543210", "482913", OtpPurpose.LOGIN);
            sender.send("+919876543210", "159264", OtpPurpose.SIGNUP);
            sender.send("+919876543210", "703815", OtpPurpose.PIN_RESET);

            assertThat(captured).hasSize(3);
            assertThat(captured)
                    .allSatisfy(message -> assertThat(message.apiKey()).isEqualTo("test-key"));
            assertMessage(
                    captured.get(0),
                    "1777179371662098726",
                    "482913 is your MedMate login OTP, valid for 10 minutes. Never share this OTP with anyone, including MedMate staff. - MedMate India Technology Pvt Ltd");
            assertMessage(
                    captured.get(1),
                    "1777179371651147672",
                    "159264 is your OTP to create your MedMate account. It is valid for 10 minutes. Do not share this OTP with anyone. - MedMate India Technology Pvt Ltd");
            assertMessage(
                    captured.get(2),
                    "1777179371668989529",
                    "703815 is your OTP to reset your MedMate account password. Valid for 10 minutes. If you did not request this, please ignore this message. - MedMate India Technology Pvt Ltd");
        } finally {
            server.stop(0);
        }
    }

    @Test
    void rejectsAFailedDelivery() throws Exception {
        HttpServer server = server(500, new ArrayList<>());
        server.start();
        try {
            TelinfySmsSender sender = new TelinfySmsSender("test-key", baseUrl(server));
            assertThatThrownBy(() -> sender.send("+919876543210", "482913", OtpPurpose.LOGIN))
                    .isInstanceOf(RestClientResponseException.class);
        } finally {
            server.stop(0);
        }
    }

    private static void assertMessage(Captured captured, String templateId, String text) throws Exception {
        JsonNode body = JSON.readTree(captured.body());
        assertThat(body.get("Sender_Name").asText()).isEqualTo("MEDMTE");
        assertThat(body.get("mobile_Number").asText()).isEqualTo("9876543210");
        assertThat(body.get("template_id").asText()).isEqualTo(templateId);
        assertThat(body.get("SMS_Message").asText()).isEqualTo(text);
    }

    private static String baseUrl(HttpServer server) {
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    private static HttpServer server(int status, List<Captured> captured) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/sms/send", exchange -> {
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            synchronized (captured) {
                captured.add(new Captured(exchange.getRequestHeaders().getFirst("x-api-key"), body));
            }
            byte[] response = "{\"status\":\"Success\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, response.length);
            try (OutputStream output = exchange.getResponseBody()) {
                output.write(response);
            }
        });
        return server;
    }

    private record Captured(String apiKey, String body) {}
}
