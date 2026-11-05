package com.medmate.servercore.identity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;
import org.bouncycastle.crypto.generators.SCrypt;

public final class SecretHashes {
    private static final SecureRandom RANDOM = new SecureRandom();

    private SecretHashes() {
    }

    public static String hashSecret(String secret) {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        byte[] hash = SCrypt.generate(secret.getBytes(StandardCharsets.UTF_8), salt, 16384, 8, 1, 32);
        return HexFormat.of().formatHex(salt) + ":" + HexFormat.of().formatHex(hash);
    }

    public static boolean matches(String secret, String stored) {
        if (stored == null || stored.isBlank()) {
            return false;
        }
        String[] parts = stored.split(":", 2);
        if (parts.length != 2 || parts[0].isEmpty() || parts[1].isEmpty()) {
            return false;
        }
        byte[] salt;
        byte[] previous;
        try {
            salt = HexFormat.of().parseHex(parts[0]);
            previous = HexFormat.of().parseHex(parts[1]);
        } catch (IllegalArgumentException exception) {
            return false;
        }
        byte[] next = SCrypt.generate(secret.getBytes(StandardCharsets.UTF_8), salt, 16384, 8, 1, 32);
        return MessageDigest.isEqual(next, previous);
    }

    public static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    public static String randomHex(int bytes) {
        byte[] buffer = new byte[bytes];
        RANDOM.nextBytes(buffer);
        return HexFormat.of().formatHex(buffer);
    }

    public static String randomToken() {
        byte[] buffer = new byte[32];
        RANDOM.nextBytes(buffer);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(buffer);
    }

    public static String otp(int length) {
        StringBuilder code = new StringBuilder();
        for (int index = 0; index < length; index++) {
            code.append(RANDOM.nextInt(10));
        }
        return code.toString();
    }
}
