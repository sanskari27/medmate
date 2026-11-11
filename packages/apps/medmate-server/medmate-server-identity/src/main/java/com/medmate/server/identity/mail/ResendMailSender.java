package com.medmate.server.identity.mail;

import java.util.List;
import java.util.Map;
import org.springframework.web.client.RestClient;

public final class ResendMailSender implements MailSender {

    private final RestClient client;
    private final String from;

    public ResendMailSender(String apiKey, String from) {
        this.from = from;
        this.client = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    @Override
    public void send(String to, String subject, String text) {
        client.post()
                .uri("/emails")
                .body(Map.of("from", from, "to", List.of(to), "subject", subject, "text", text))
                .retrieve()
                .toBodilessEntity();
    }
}
