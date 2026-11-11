package com.medmate.server.identity.sms;

import org.springframework.web.client.RestClient;

public final class HttpSmsSender implements SmsSender {

    private final RestClient client;

    public HttpSmsSender(String baseUrl) {
        String root = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.client = RestClient.builder().baseUrl(root).build();
    }

    @Override
    public void send(String phone, String code) {
        client.post().uri("/messages").body(new Message(phone, code)).retrieve().toBodilessEntity();
    }

    public record Message(String phone, String code) {}
}
