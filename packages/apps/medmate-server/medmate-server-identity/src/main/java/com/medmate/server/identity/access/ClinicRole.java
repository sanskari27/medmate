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
}
