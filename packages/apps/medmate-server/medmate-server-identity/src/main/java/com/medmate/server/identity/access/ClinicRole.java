package com.medmate.server.identity.access;

import java.util.Locale;

public enum ClinicRole {
    OWNER,
    DOCTOR,
    NURSE,
    FRONT_DESK,
    ADMIN;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static ClinicRole parse(String raw) {
        if (raw == null) {
            return null;
        }
        String normalized = raw.trim().toLowerCase(Locale.ROOT);
        for (ClinicRole role : values()) {
            if (role.wire().equals(normalized)) {
                return role;
            }
        }
        return null;
    }
}
