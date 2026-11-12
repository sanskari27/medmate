package com.medmate.server.identity.access;

import java.util.List;

public final class PharmacyPermissions {

    public static final List<String> KEYS = List.of(
            "users:read",
            "users:create",
            "users:update",
            "users:delete",
            "support:read",
            "support:write",
            "employees:read",
            "employees:create",
            "employees:update",
            "employees:delete");

    private PharmacyPermissions() {}

    public static boolean valid(String key) {
        return key != null && KEYS.contains(key);
    }
}
