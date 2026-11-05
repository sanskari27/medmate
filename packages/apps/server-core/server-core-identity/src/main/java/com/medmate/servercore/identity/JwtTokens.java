package com.medmate.servercore.identity;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class JwtTokens {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

    private JwtTokens() {
    }

    public static String sign(String userId, String phone, String pharmacyId, String sessionId, String secret, long nowSeconds, int ttlSeconds) {
        ObjectNode header = MAPPER.createObjectNode();
        header.put("alg", "HS256");
        header.put("typ", "JWT");
        ObjectNode body = MAPPER.createObjectNode();
        body.put("sub", userId);
        body.put("phone", phone);
        body.put("pid", pharmacyId);
        body.put("sid", sessionId);
        body.put("typ", "access");
        body.put("iat", nowSeconds);
        body.put("exp", nowSeconds + ttlSeconds);
        String encodedHeader = ENCODER.encodeToString(header.toString().getBytes(StandardCharsets.UTF_8));
        String encodedBody = ENCODER.encodeToString(body.toString().getBytes(StandardCharsets.UTF_8));
        return encodedHeader + "." + encodedBody + "." + signature(encodedHeader + "." + encodedBody, secret);
    }

    public static Claims verify(String token, String secret, long nowSeconds, boolean ignoreExpiry) {
        if (token == null) {
            return null;
        }
        String[] parts = token.split("\\.");
        if (parts.length != 3) {
            return null;
        }
        try {
            JsonNode header = MAPPER.readTree(DECODER.decode(parts[0]));
            if (!"HS256".equals(header.path("alg").asText())) {
                return null;
            }
            String expected = signature(parts[0] + "." + parts[1], secret);
            if (!MessageDigest.isEqual(parts[2].getBytes(StandardCharsets.UTF_8), expected.getBytes(StandardCharsets.UTF_8))) {
                return null;
            }
            JsonNode payload = MAPPER.readTree(DECODER.decode(parts[1]));
            String userId = payload.path("sub").asText("");
            String sessionId = payload.path("sid").asText("");
            String pharmacyId = payload.path("pid").asText("");
            String phone = payload.path("phone").asText("");
            if (!"access".equals(payload.path("typ").asText()) || userId.isEmpty() || sessionId.isEmpty() || pharmacyId.isEmpty() || phone.isEmpty()) {
                return null;
            }
            long expires = payload.path("exp").asLong();
            if (!ignoreExpiry && expires <= nowSeconds) {
                return null;
            }
            return new Claims(userId, phone, pharmacyId, sessionId, expires);
        } catch (Exception exception) {
            return null;
        }
    }

    public static String sessionId(String token, String secret) {
        if (token == null) {
            return null;
        }
        if (!token.contains(".")) {
            return token;
        }
        Claims claims = verify(token, secret, Instant.now().getEpochSecond(), true);
        return claims == null ? null : claims.sessionId();
    }

    private static String signature(String content, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return ENCODER.encodeToString(mac.doFinal(content.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    public record Claims(String userId, String phone, String pharmacyId, String sessionId, long expiresAt) {
    }
}
