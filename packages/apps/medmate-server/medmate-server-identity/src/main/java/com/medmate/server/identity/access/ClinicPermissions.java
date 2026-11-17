package com.medmate.server.identity.access;

import java.util.List;

public final class ClinicPermissions {

    public static final List<String> KEYS = List.of(
            "clinic:patients:read", "clinic:patients:read_clinical", "clinic:billing:read", "clinic:staff:read");

    private ClinicPermissions() {}

    public static boolean valid(String key) {
        return key != null && KEYS.contains(key);
    }
}
