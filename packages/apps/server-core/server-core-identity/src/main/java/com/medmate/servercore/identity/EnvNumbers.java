package com.medmate.servercore.identity;

public final class EnvNumbers {
    private EnvNumbers() {
    }

    public static int integer(String name, int fallback) {
        String raw = System.getenv(name);
        if (raw == null || raw.isEmpty() || !raw.matches("\\d+")) {
            return fallback;
        }
        try {
            return Integer.parseInt(raw);
        } catch (NumberFormatException exception) {
            return fallback;
        }
    }

    public static int accessTtl() {
        return Math.max(1, integer("AUTH_ACCESS_TTL_SECONDS", 900));
    }

    public static int refreshTtl() {
        return Math.max(1, integer("AUTH_REFRESH_TTL_SECONDS", 30 * 86400));
    }

    public static OtpSettings otp() {
        int length = integer("OTP_LENGTH", 6);
        if (length < 4 || length > 10) {
            length = 6;
        }
        return new OtpSettings(
                length,
                integer("OTP_TTL_SECONDS", 600) * 1000L,
                Math.max(1, integer("OTP_MAX_ATTEMPTS", 5)),
                integer("OTP_RESEND_COOLDOWN_SECONDS", 30) * 1000L,
                Math.max(1, integer("OTP_MAX_SENDS", 5)),
                Math.max(1, integer("OTP_SEND_WINDOW_SECONDS", 900)) * 1000L);
    }

    public record OtpSettings(int length, long ttlMillis, int maxAttempts, long cooldownMillis, int maxSends, long windowMillis) {
    }
}
