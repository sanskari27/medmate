package com.medmate.servercore.identity;

import com.medmate.servercore.kernel.ApiError;
import java.security.SecureRandom;
import java.util.HexFormat;

public final class JwtSecrets {
    private static volatile String developmentSecret;

    private JwtSecrets() {
    }

    public static String current(String configured, boolean production) {
        if (configured != null && !configured.isBlank()) {
            return configured;
        }
        String environment = System.getenv("AUTH_JWT_SECRET");
        if (environment != null && !environment.isBlank()) {
            return environment;
        }
        if (production) {
            throw new ApiError(500, "VALIDATION", "AUTH_JWT_SECRET is required");
        }
        if (developmentSecret == null) {
            byte[] bytes = new byte[32];
            new SecureRandom().nextBytes(bytes);
            developmentSecret = HexFormat.of().formatHex(bytes);
        }
        return developmentSecret;
    }
}
