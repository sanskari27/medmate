package com.medmate.server.identity.otp;

import java.util.Locale;

public enum OtpPurpose {
    LOGIN,
    SIGNUP,
    PIN_RESET;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static OtpPurpose parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT).replace('-', '_');
        try {
            return valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
