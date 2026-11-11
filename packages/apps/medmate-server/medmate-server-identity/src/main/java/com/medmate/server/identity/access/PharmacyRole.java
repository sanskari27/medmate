package com.medmate.server.identity.access;

import java.util.Locale;

public enum PharmacyRole {
    OWNER,
    STAFF;

    public String wire() {
        return name().toLowerCase(Locale.ROOT);
    }
}
