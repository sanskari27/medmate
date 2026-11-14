package com.medmate.server.wards;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

public final class WardRules {

    public static final String READ = "wards:read";
    public static final String CREATE = "wards:create";
    public static final String UPDATE = "wards:update";
    public static final String ADMIT = "wards:admit";
    public static final String TRANSFER = "wards:transfer";
    public static final String DISCHARGE = "wards:discharge";

    public static final List<String> CATEGORIES =
            List.of("General", "ICU", "Pediatric", "Maternity", "Surgical", "Private");
    public static final Set<String> PAY_MODES = Set.of("cash", "upi", "card", "insurance");

    private static final int NAME_MAX = 100;
    private static final int CODE_MAX = 12;
    private static final int FLOOR_MAX = 80;
    private static final int SISTER_MAX = 100;
    private static final int NOTE_MAX = 500;
    private static final int BEDS_MAX = 200;
    private static final int UHID_MAX = 40;
    private static final int PHONE_MAX = 20;
    private static final int DOCTOR_MAX = 100;
    private static final int DIAGNOSIS_MAX = 500;
    private static final int INSURER_MAX = 100;
    private static final int POLICY_MAX = 60;
    private static final long DAY_MILLIS = 86_400_000L;
    private static final BigDecimal MAX_RATE = new BigDecimal("999999999999.99");
    private static final Pattern CODE = Pattern.compile("[A-Z0-9-]+");

    private WardRules() {}

    public record WardValues(
            String name,
            String code,
            String floor,
            String category,
            int beds,
            String sister,
            BigDecimal dailyRate,
            int bedsHeld,
            boolean underMaintenance,
            String maintenanceNote) {}

    public record Prepared(WardValues values, String problem) {}

    public record AdmissionValues(
            String name,
            String uhid,
            String phone,
            Integer age,
            String gender,
            UUID wardId,
            String bed,
            String doctor,
            String diagnosis,
            String payerType,
            String insurer,
            String policyNo) {}

    public record PreparedAdmission(AdmissionValues values, String problem) {}

    public static Prepared prepareCreate(JsonNode body) {
        if (body == null || !body.isObject()) {
            return fail("Ward name is required");
        }
        return prepare(body, null, false);
    }

    public static Prepared prepareUpdate(JsonNode body, WardValues current) {
        if (body == null || !body.isObject()) {
            return new Prepared(current, null);
        }
        return prepare(body, current, true);
    }

    public static PreparedAdmission prepareAdmit(JsonNode body) {
        if (body == null || !body.isObject()) {
            return failAdmit("Patient name is required");
        }
        String nameProblem = lengthProblem(
                text(body, "name"), true, NAME_MAX, "Patient name is required", "Patient name is too long");
        if (nameProblem != null) {
            return failAdmit(nameProblem);
        }
        String uhidProblem = lengthProblem(text(body, "uhid"), true, UHID_MAX, "UHID is required", "UHID is too long");
        if (uhidProblem != null) {
            return failAdmit(uhidProblem);
        }
        String phoneProblem = optionalLength(body, "phone", PHONE_MAX, "Phone is too long");
        if (phoneProblem != null) {
            return failAdmit(phoneProblem);
        }
        String ageProblem = ageProblem(body);
        if (ageProblem != null) {
            return failAdmit(ageProblem);
        }
        String genderProblem =
                choiceProblem(body, "gender", Set.of("Male", "Female", "Other"), "Gender is not recognised");
        if (genderProblem != null) {
            return failAdmit(genderProblem);
        }
        UUID wardId = uuid(body, "wardId");
        if (wardId == null) {
            return failAdmit("Ward was not found");
        }
        if (text(body, "bed").isEmpty()) {
            return failAdmit("Bed is required");
        }
        String doctorProblem = optionalLength(body, "doctor", DOCTOR_MAX, "Doctor name is too long");
        if (doctorProblem != null) {
            return failAdmit(doctorProblem);
        }
        String diagnosisProblem = optionalLength(body, "diagnosis", DIAGNOSIS_MAX, "Diagnosis is too long");
        if (diagnosisProblem != null) {
            return failAdmit(diagnosisProblem);
        }
        String payer = text(body, "payerType");
        if (payer.isEmpty()) {
            payer = "self";
        }
        if (!payer.equals("self") && !payer.equals("insurance")) {
            return failAdmit("Payer is not recognised");
        }
        String insurerProblem = payer.equals("insurance")
                ? lengthProblem(text(body, "insurer"), true, INSURER_MAX, "Insurer is required", "Insurer is too long")
                : optionalLength(body, "insurer", INSURER_MAX, "Insurer is too long");
        if (insurerProblem != null) {
            return failAdmit(insurerProblem);
        }
        String policyProblem = optionalLength(body, "policyNo", POLICY_MAX, "Policy number is too long");
        if (policyProblem != null) {
            return failAdmit(policyProblem);
        }
        return new PreparedAdmission(
                new AdmissionValues(
                        text(body, "name"),
                        text(body, "uhid"),
                        blankToNull(text(body, "phone")),
                        age(body),
                        blankToNull(text(body, "gender")),
                        wardId,
                        text(body, "bed"),
                        blankToNull(text(body, "doctor")),
                        blankToNull(text(body, "diagnosis")),
                        payer,
                        payer.equals("insurance") ? text(body, "insurer") : null,
                        payer.equals("insurance") ? blankToNull(text(body, "policyNo")) : null),
                null);
    }

    public static String codeKey(String code) {
        return code == null ? "" : code.trim().toLowerCase(Locale.ROOT);
    }

    public static String uhidKey(String uhid) {
        return uhid == null ? "" : uhid.trim().toLowerCase(Locale.ROOT);
    }

    public static String bedLabel(String code, int number) {
        return code + "-" + number;
    }

    public static Integer bedNumber(String code, String bed) {
        if (code == null || bed == null) {
            return null;
        }
        String prefix = code + "-";
        if (bed.length() <= prefix.length() || !bed.regionMatches(true, 0, prefix, 0, prefix.length())) {
            return null;
        }
        String rest = bed.substring(prefix.length());
        if (!rest.matches("[1-9]\\d*")) {
            return null;
        }
        try {
            return Integer.valueOf(rest);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    public static boolean held(int beds, int bedsHeld, int bedNumber) {
        return bedNumber > beds - bedsHeld;
    }

    public static String assignProblem(
            int beds, int bedsHeld, int bedNumber, boolean occupied, boolean maintenanceBlocks) {
        if (bedNumber < 1 || bedNumber > beds || occupied) {
            return "Bed is not free";
        }
        if (held(beds, bedsHeld, bedNumber)) {
            return "Bed is held for maintenance";
        }
        if (maintenanceBlocks) {
            return "Ward is under maintenance";
        }
        return null;
    }

    public static String capacityProblem(int beds, int bedsHeld, List<Integer> occupied) {
        for (int number : occupied) {
            if (number > beds) {
                return "Bed count is below the occupied beds";
            }
            if (held(beds, bedsHeld, number)) {
                return "Held beds cover an occupied bed";
            }
        }
        return null;
    }

    public static int days(Instant admitted, Instant now) {
        long elapsed = Math.max(0, Duration.between(admitted, now).toMillis());
        long whole = (elapsed + DAY_MILLIS - 1) / DAY_MILLIS;
        return (int) Math.max(1, whole);
    }

    public static BigDecimal charge(BigDecimal dailyRate, int days) {
        return money(dailyRate).multiply(BigDecimal.valueOf(days)).setScale(2, RoundingMode.HALF_UP);
    }

    public static String moneyText(BigDecimal amount) {
        return money(amount).toPlainString();
    }

    public static String payModeProblem(JsonNode body) {
        if (body == null || !body.has("payMode") || body.get("payMode").isNull()) {
            return null;
        }
        String mode = text(body, "payMode");
        if (mode.isEmpty()) {
            return "Pay mode is required";
        }
        return PAY_MODES.contains(mode) ? null : "Pay mode is not recognised";
    }

    public static String payMode(JsonNode body) {
        if (payModeProblem(body) != null
                || body == null
                || !body.has("payMode")
                || body.get("payMode").isNull()) {
            return null;
        }
        String mode = text(body, "payMode");
        return mode.isEmpty() ? null : mode;
    }

    private static Prepared prepare(JsonNode body, WardValues current, boolean updating) {
        String nameProblem = lengthProblem(
                updating && !present(body, "name") ? current.name() : text(body, "name"),
                true,
                NAME_MAX,
                "Ward name is required",
                "Ward name is too long");
        if (nameProblem != null) {
            return fail(nameProblem);
        }
        String codeProblem = codeProblem(body, current, updating);
        if (codeProblem != null) {
            return fail(codeProblem);
        }
        String floorProblem = optionalLength(body, "floor", FLOOR_MAX, "Floor is too long");
        if (floorProblem != null) {
            return fail(floorProblem);
        }
        String categoryProblem = categoryProblem(body, updating);
        if (categoryProblem != null) {
            return fail(categoryProblem);
        }
        String bedsProblem = bedsProblem(body, updating);
        if (bedsProblem != null) {
            return fail(bedsProblem);
        }
        String sisterProblem = optionalLength(body, "sister", SISTER_MAX, "Nurse name is too long");
        if (sisterProblem != null) {
            return fail(sisterProblem);
        }
        String rateProblem = rateProblem(body, updating);
        if (rateProblem != null) {
            return fail(rateProblem);
        }
        String heldProblem = heldProblem(body, updating);
        if (heldProblem != null) {
            return fail(heldProblem);
        }
        String flagProblem = flagProblem(body);
        if (flagProblem != null) {
            return fail(flagProblem);
        }
        String noteProblem = optionalLength(body, "maintenanceNote", NOTE_MAX, "Maintenance note is too long");
        if (noteProblem != null) {
            return fail(noteProblem);
        }
        int beds = beds(body, current, updating);
        int bedsHeld = bedsHeld(body, current, updating);
        if (bedsHeld > beds) {
            return fail("Beds held is invalid");
        }
        String code = code(body, current, updating);
        return new Prepared(
                new WardValues(
                        updating && !present(body, "name") ? current.name() : text(body, "name"),
                        code,
                        cleared(body, "floor", updating ? current.floor() : null, updating),
                        category(body, current, updating),
                        beds,
                        cleared(body, "sister", updating ? current.sister() : null, updating),
                        rate(body, current, updating),
                        bedsHeld,
                        flag(body, current == null ? false : current.underMaintenance()),
                        cleared(body, "maintenanceNote", updating ? current.maintenanceNote() : null, updating)),
                null);
    }

    private static String codeProblem(JsonNode body, WardValues current, boolean updating) {
        if (updating && !present(body, "code")) {
            return null;
        }
        String value = text(body, "code").toUpperCase(Locale.ROOT);
        if (value.isEmpty()) {
            return "Ward code is required";
        }
        if (value.length() > CODE_MAX) {
            return "Ward code is too long";
        }
        if (!CODE.matcher(value).matches()) {
            return "Ward code is invalid";
        }
        return null;
    }

    private static String code(JsonNode body, WardValues current, boolean updating) {
        if (updating && !present(body, "code")) {
            return current.code();
        }
        return text(body, "code").toUpperCase(Locale.ROOT);
    }

    private static String categoryProblem(JsonNode body, boolean updating) {
        if (updating && !present(body, "category")) {
            return null;
        }
        if (!present(body, "category")) {
            return null;
        }
        String value = text(body, "category");
        return CATEGORIES.contains(value) ? null : "Ward category is not recognised";
    }

    private static String category(JsonNode body, WardValues current, boolean updating) {
        if (!present(body, "category")) {
            return updating ? current.category() : "General";
        }
        return text(body, "category");
    }

    private static String bedsProblem(JsonNode body, boolean updating) {
        if (updating && !present(body, "beds")) {
            return null;
        }
        Integer value = whole(body, "beds");
        if (value == null || value < 1 || value > BEDS_MAX) {
            return "Bed count is invalid";
        }
        return null;
    }

    private static int beds(JsonNode body, WardValues current, boolean updating) {
        if (updating && !present(body, "beds")) {
            return current.beds();
        }
        return whole(body, "beds");
    }

    private static String heldProblem(JsonNode body, boolean updating) {
        if (!present(body, "bedsHeld")) {
            return null;
        }
        Integer value = whole(body, "bedsHeld");
        if (value == null || value < 0) {
            return "Beds held is invalid";
        }
        return null;
    }

    private static int bedsHeld(JsonNode body, WardValues current, boolean updating) {
        if (!present(body, "bedsHeld")) {
            return updating ? current.bedsHeld() : 0;
        }
        return whole(body, "bedsHeld");
    }

    private static String rateProblem(JsonNode body, boolean updating) {
        if (!present(body, "dailyRate")) {
            return null;
        }
        return rateValue(body.get("dailyRate")) == null ? "Daily rate is invalid" : null;
    }

    private static BigDecimal rate(JsonNode body, WardValues current, boolean updating) {
        if (!present(body, "dailyRate")) {
            return updating ? current.dailyRate() : money(BigDecimal.ZERO);
        }
        return rateValue(body.get("dailyRate"));
    }

    private static BigDecimal rateValue(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        BigDecimal value;
        try {
            if (node.isNumber()) {
                value = node.decimalValue();
            } else if (node.isTextual()) {
                value = new BigDecimal(node.asText().trim());
            } else {
                return null;
            }
        } catch (NumberFormatException exception) {
            return null;
        }
        if (value.signum() < 0 || value.stripTrailingZeros().scale() > 2 || value.compareTo(MAX_RATE) > 0) {
            return null;
        }
        return money(value);
    }

    private static String flagProblem(JsonNode body) {
        if (body == null || !body.has("underMaintenance")) {
            return null;
        }
        JsonNode node = body.get("underMaintenance");
        if (node.isNull() || !node.isBoolean()) {
            return "Maintenance flag is not recognised";
        }
        return null;
    }

    private static boolean flag(JsonNode body, boolean current) {
        if (body == null
                || !body.has("underMaintenance")
                || body.get("underMaintenance").isNull()) {
            return current;
        }
        return body.get("underMaintenance").asBoolean();
    }

    private static String ageProblem(JsonNode body) {
        if (!present(body, "age")) {
            return null;
        }
        if (body.get("age").isNull()) {
            return null;
        }
        Integer value = whole(body, "age");
        if (value == null || value < 0 || value > 150) {
            return "Age is invalid";
        }
        return null;
    }

    private static Integer age(JsonNode body) {
        if (!present(body, "age") || body.get("age").isNull()) {
            return null;
        }
        return whole(body, "age");
    }

    private static String choiceProblem(JsonNode body, String field, Set<String> allowed, String detail) {
        if (!present(body, field) || body.get(field).isNull()) {
            return null;
        }
        String value = text(body, field);
        if (value.isEmpty()) {
            return null;
        }
        return allowed.contains(value) ? null : detail;
    }

    private static String optionalLength(JsonNode body, String field, int max, String tooLong) {
        if (!present(body, field) || body.get(field).isNull()) {
            return null;
        }
        return text(body, field).length() > max ? tooLong : null;
    }

    private static String lengthProblem(String value, boolean required, int max, String missing, String tooLong) {
        if (value == null || value.isEmpty()) {
            return required ? missing : null;
        }
        return value.length() > max ? tooLong : null;
    }

    private static String cleared(JsonNode body, String field, String current, boolean updating) {
        if (!present(body, field)) {
            return updating ? current : null;
        }
        if (body.get(field).isNull()) {
            return null;
        }
        return blankToNull(text(body, field));
    }

    private static String blankToNull(String value) {
        return value == null || value.isEmpty() ? null : value;
    }

    private static Integer whole(JsonNode body, String field) {
        if (body == null || !body.has(field) || body.get(field).isNull()) {
            return null;
        }
        JsonNode node = body.get(field);
        if (!node.isIntegralNumber()) {
            return null;
        }
        return node.intValue();
    }

    private static UUID uuid(JsonNode body, String field) {
        String value = text(body, field);
        if (value.isEmpty()) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private static boolean present(JsonNode body, String field) {
        return body != null && body.has(field);
    }

    private static String text(JsonNode body, String field) {
        if (body == null || !body.has(field) || body.get(field).isNull()) {
            return "";
        }
        return body.get(field).asText("").trim();
    }

    private static BigDecimal money(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private static Prepared fail(String problem) {
        return new Prepared(null, problem);
    }

    private static PreparedAdmission failAdmit(String problem) {
        return new PreparedAdmission(null, problem);
    }
}
