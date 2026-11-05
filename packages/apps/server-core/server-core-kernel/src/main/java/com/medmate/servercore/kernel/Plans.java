package com.medmate.servercore.kernel;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;

public final class Plans {
    public static final List<String> FREE_ROUTES = List.of("pos", "inventory", "purchases", "invoicing", "users");
    public static final List<String> ALWAYS_ROUTES = List.of(
            "dashboard", "account", "subscription", "settings", "support", "notifications", "menu", "refer");
    public static final List<String> HOSPITAL_ROUTES = List.of(
            "wards", "hospbill", "ptbills", "salesreg", "indents", "departments", "doctors");
    public static final List<String> PREMIUM_ROUTES = List.of(
            "orders", "sales", "prescriptions", "customers", "khata", "crm", "rackmap", "reorder", "distributors",
            "online", "offers", "kiosk", "reports", "expenses", "ca", "employees",
            "wards", "hospbill", "ptbills", "salesreg", "indents", "departments", "doctors");
    public static final int SEAT_CAP = 50;

    private Plans() {
    }

    public static String asPlan(Object value) {
        if (value == null) {
            return null;
        }
        return switch (String.valueOf(value)) {
            case "Essential", "Free" -> "Essential";
            case "Care", "Starter" -> "Care";
            case "Growth" -> "Growth";
            case "Flagship", "Pro" -> "Flagship";
            default -> null;
        };
    }

    public static boolean isFreePlan(String plan) {
        return "Essential".equals(asPlan(plan));
    }

    public static String todayIso() {
        return Instant.now().toString().substring(0, 10);
    }

    public static String shiftDays(int days) {
        return LocalDate.now(ZoneOffset.UTC).plusDays(days).toString();
    }

    public static boolean subscriptionLapsed(String plan, String status, String renewsOn, String today) {
        boolean dated = renewsOn != null && renewsOn.matches("\\d{4}-\\d{2}-\\d{2}") && renewsOn.compareTo(today) < 0;
        return !isFreePlan(plan) && ("expired".equals(status) || dated);
    }

    public static Integer includedSeats(String plan) {
        String named = asPlan(plan);
        if ("Flagship".equals(named)) {
            return null;
        }
        return "Growth".equals(named) ? 5 : 2;
    }

    public static Integer seatCeiling(String plan, int extraSeats) {
        Integer included = includedSeats(plan);
        if (included == null) {
            return null;
        }
        return included + Math.max(0, extraSeats);
    }

    public static boolean routeLocked(String route, String plan, String status, String renewsOn, String businessType, Set<String> openGrants) {
        if (HOSPITAL_ROUTES.contains(route) && !"hospital".equals(businessType)) {
            return true;
        }
        if (FREE_ROUTES.contains(route) || ALWAYS_ROUTES.contains(route)) {
            return false;
        }
        if (!isFreePlan(plan) && !subscriptionLapsed(plan, status, renewsOn, todayIso())) {
            return false;
        }
        return openGrants == null || !openGrants.contains(route);
    }
}
