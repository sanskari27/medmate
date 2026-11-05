package com.medmate.servercore.kernel;

import java.util.List;
import java.util.Map;

public final class Permissions {
    public static final List<String> ALL_PERM_KEYS = List.of(
            "pos", "orders", "prescriptions", "credit",
            "inventory", "purchases", "rackmap", "distributors",
            "dashboard", "reports", "crm",
            "online_store", "employees", "users", "settings");

    public static final Map<String, List<String>> ROLE_DEFAULT_PERMS = Map.of(
            "Owner", ALL_PERM_KEYS,
            "Manager", List.of("dashboard", "pos", "orders", "prescriptions", "credit", "inventory", "purchases", "rackmap", "distributors", "reports", "crm", "online_store"),
            "Pharmacist", List.of("pos", "orders", "prescriptions", "inventory", "rackmap", "crm"),
            "Cashier", List.of("pos", "orders", "credit"));

    public static final Map<String, String> ROUTE_PERM = Map.ofEntries(
            Map.entry("dashboard", "dashboard"),
            Map.entry("pos", "pos"),
            Map.entry("orders", "orders"),
            Map.entry("prescriptions", "prescriptions"),
            Map.entry("khata", "credit"),
            Map.entry("crm", "crm"),
            Map.entry("inventory", "inventory"),
            Map.entry("rackmap", "rackmap"),
            Map.entry("purchases", "purchases"),
            Map.entry("reorder", "purchases"),
            Map.entry("distributors", "distributors"),
            Map.entry("online", "online_store"),
            Map.entry("offers", "online_store"),
            Map.entry("reports", "reports"),
            Map.entry("expenses", "reports"),
            Map.entry("employees", "employees"),
            Map.entry("users", "users"),
            Map.entry("settings", "settings"),
            Map.entry("invoicing", "settings"));

    private Permissions() {
    }
}
