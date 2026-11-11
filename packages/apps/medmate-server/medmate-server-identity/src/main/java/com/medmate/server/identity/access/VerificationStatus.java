package com.medmate.server.identity.access;

import java.util.Locale;

public enum VerificationStatus {
    INCOMPLETE,
    PENDING_COMPLIANCE,
    PENDING_ADMIN,
    APPROVED,
    REJECTED;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static VerificationStatus parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
