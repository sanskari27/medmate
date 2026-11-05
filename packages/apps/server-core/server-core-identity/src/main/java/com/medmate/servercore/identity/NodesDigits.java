package com.medmate.servercore.identity;

public final class NodesDigits {
    private NodesDigits() {
    }

    public static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }
}
