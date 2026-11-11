package com.medmate.server.identity.phone;

import java.util.regex.Pattern;

public final class PhoneNumbers {

    private static final Pattern NATIONAL = Pattern.compile("^[6-9][0-9]{9}$");
    private static final Pattern E164 = Pattern.compile("^\\+91[6-9][0-9]{9}$");

    private PhoneNumbers() {}

    public static String normalize(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim().replace(" ", "");
        if (NATIONAL.matcher(trimmed).matches()) {
            return "+91" + trimmed;
        }
        if (E164.matcher(trimmed).matches()) {
            return trimmed;
        }
        return null;
    }
}
