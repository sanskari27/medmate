package com.medmate.servercore.kernel;

public final class PhoneNumbers {
    private PhoneNumbers() {
    }

    public static String e164(String phone) {
        String raw = phone == null ? "" : phone;
        String digits = raw.replaceAll("\\D", "");
        if (digits.length() == 10) {
            return "+91" + digits;
        }
        if (digits.startsWith("91") && digits.length() == 12) {
            return "+" + digits;
        }
        return "+" + digits;
    }
}
