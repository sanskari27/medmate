package com.medmate.servercore.kernel;

import java.util.List;
import java.util.Map;

public final class ProfileRules {
    public static final List<String> INDIAN_STATES = List.of(
            "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana",
            "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
            "Manipur", "Meghalaya", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
            "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal");

    private ProfileRules() {
    }

    public static boolean isValidIfsc(String value) {
        return value != null && value.trim().toUpperCase().matches("[A-Z]{4}0[A-Z0-9]{6}");
    }

    public static boolean isValidGstin(String value) {
        return value != null && value.trim().toUpperCase().matches("[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]");
    }

    public static String normalizeRack(String code) {
        return code == null ? "" : code.trim().toUpperCase();
    }

    public record SetupGap(int step, String message) {
    }

    public static SetupGap setupGap(Map<String, String> fields, boolean gstFile, boolean panFile, boolean drugLicenceFile, boolean fssaiFile, boolean tradeFile, boolean signature) {
        if (blank(fields.get("name"))) {
            return new SetupGap(1, "Pharmacy name is required");
        }
        if (blank(fields.get("registrationType"))) {
            return new SetupGap(1, "Registration type is required");
        }
        if (blank(fields.get("industryType"))) {
            return new SetupGap(1, "Industry is required");
        }
        if (Nodes.digits(fields.get("phone")).length() < 10) {
            return new SetupGap(1, "Enter a valid mobile number");
        }
        if (fields.get("email") == null || !fields.get("email").trim().matches("\\S+@\\S+\\.\\S+")) {
            return new SetupGap(1, "Email is required");
        }
        if (blank(fields.get("address")) || blank(fields.get("city")) || !INDIAN_STATES.contains(fields.get("state")) || blank(fields.get("pincode"))) {
            return new SetupGap(2, "Address, city, state and pincode are required");
        }
        if (!isValidGstin(fields.get("gstin"))) {
            return new SetupGap(3, "Enter a valid GSTIN");
        }
        if (!gstFile) {
            return new SetupGap(3, "Attach the GST certificate");
        }
        if (blank(fields.get("pan"))) {
            return new SetupGap(3, "PAN number is required");
        }
        if (!panFile) {
            return new SetupGap(3, "Attach the PAN card");
        }
        if (blank(fields.get("dlNo"))) {
            return new SetupGap(3, "Drug licence number is required");
        }
        if (!drugLicenceFile) {
            return new SetupGap(3, "Attach the drug licence");
        }
        if (blank(fields.get("fssai"))) {
            return new SetupGap(3, "FSSAI licence number is required");
        }
        if (!fssaiFile) {
            return new SetupGap(3, "Attach the FSSAI licence");
        }
        if (blank(fields.get("tradeNo"))) {
            return new SetupGap(3, "Trade licence number is required");
        }
        if (!tradeFile) {
            return new SetupGap(3, "Attach the trade licence");
        }
        if (blank(fields.get("pharmacist"))) {
            return new SetupGap(4, "Registered pharmacist name is required");
        }
        if (blank(fields.get("invoicePrefix"))) {
            return new SetupGap(5, "Invoice prefix is required");
        }
        if (!signature) {
            return new SetupGap(5, "Signature is required");
        }
        return null;
    }

    private static boolean blank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
