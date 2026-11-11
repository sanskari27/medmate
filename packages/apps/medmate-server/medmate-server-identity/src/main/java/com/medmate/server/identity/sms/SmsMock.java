package com.medmate.server.identity.sms;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class SmsMock {

    private static final Pattern PHONE = Pattern.compile("\"phone\"\\s*:\\s*\"([^\"]*)\"");
    private static final Pattern CODE = Pattern.compile("\"code\"\\s*:\\s*\"([^\"]*)\"");
    private static final List<String> MESSAGES = new ArrayList<>();

    private SmsMock() {}

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("SMS_MOCK_PORT", "8090"));
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", port), 0);
        server.createContext("/messages", SmsMock::handle);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        server.start();
        System.out.println("SMS mock listening on http://127.0.0.1:" + port);
    }

    private static void handle(HttpExchange exchange) throws IOException {
        try {
            if ("POST".equals(exchange.getRequestMethod())) {
                String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                Matcher phone = PHONE.matcher(body);
                Matcher code = CODE.matcher(body);
                if (!phone.find() || !code.find()) {
                    respond(exchange, 400, "{\"title\":\"Bad request\"}");
                    return;
                }
                synchronized (MESSAGES) {
                    MESSAGES.add("{\"phone\":\"" + phone.group(1) + "\",\"code\":\"" + code.group(1) + "\"}");
                    if (MESSAGES.size() > 50) {
                        MESSAGES.remove(0);
                    }
                }
                respond(exchange, 202, "{\"status\":\"accepted\"}");
                return;
            }
            if ("GET".equals(exchange.getRequestMethod())) {
                String json;
                synchronized (MESSAGES) {
                    json = "[" + String.join(",", MESSAGES) + "]";
                }
                respond(exchange, 200, json);
                return;
            }
            respond(exchange, 404, "{\"title\":\"Not found\"}");
        } catch (IOException exception) {
            respond(exchange, 500, "{\"title\":\"Unexpected error\"}");
        }
    }

    private static void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }
}
