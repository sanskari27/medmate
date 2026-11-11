package com.medmate.server.identity.access;

import java.util.Locale;

public enum AccountType {
    ADMIN,
    PHARMACY,
    CUSTOMER,
    RIDER,
    STAFF;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static AccountType parse(String raw) {
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
