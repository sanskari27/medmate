package com.medmate.server.doctors;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.pharmacy.PharmacyRules;
import com.medmate.server.identity.phone.PhoneNumbers;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

public final class DoctorRules {

    public static final String READ = "doctors:read";
    public static final String CREATE = "doctors:create";
    public static final String UPDATE = "doctors:update";
    public static final int PHOTO_MAX = 2 * 1024 * 1024;
    public static final int DOCUMENT_MAX = 5 * 1024 * 1024;

    private static final int CODE_MAX = 32;
    private static final int DOCUMENT_TYPE_MAX = 80;
    private static final int EMAIL_MAX = 160;
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PIN = Pattern.compile("^[1-9][0-9]{5}$");
    private static final Pattern TIME = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");
    private static final Pattern FEE = Pattern.compile("^\\d+(\\.\\d{1,2})?$");
    private static final Set<String> GENDERS = Set.of("male", "female", "other");
    private static final Set<String> STATUSES = Set.of("active", "inactive");
    private static final Set<String> TYPES = Set.of("online", "offline", "both");
    private static final Set<String> DAYS =
            Set.of("monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday");
    private static final Set<String> WORKPLACES = Set.of("clinic", "hospital", "nursing-home");
    private static final Set<String> RELATIONSHIPS = Set.of("in-house", "visiting", "on-call");
    private static final Set<String> VERIFICATION = Set.of("pending", "verified", "rejected");
    private static final Set<String> PHOTOS = Set.of("image/jpeg", "image/png");
    private static final Set<String> DOCUMENTS = Set.of("image/jpeg", "image/png", "application/pdf");

    private DoctorRules() {}

    public record Upload(String fileName, String contentType, byte[] body) {}

    public record DocumentUpload(String documentType, String verificationStatus, Upload file) {}

    public record Window(String type, List<String> days, String start, String end, BigDecimal fee) {}

    public record DocumentChange(UUID id, String verificationStatus) {}

    public record Values(
            String code,
            String firstName,
            String lastName,
            String displayName,
            String gender,
            String status,
            String registrationNumber,
            String registrationCouncil,
            String registrationState,
            String qualification,
            String specialization,
            String subSpecialization,
            Integer yearsExperience,
            String primaryMobile,
            String alternateMobile,
            String email,
            String whatsapp,
            String relationshipStatus,
            String notes,
            String workplaceName,
            String workplaceType,
            String address,
            String city,
            String state,
            String pinCode,
            String workplacePhone,
            List<Window> windows,
            UUID departmentId) {}

    public record Prepared(Values values, List<DocumentChange> documentChanges, String problem) {}

    public static Prepared prepareCreate(JsonNode body) {
        if (body == null || !body.isObject()) {
            return fail("Doctor code is required");
        }
        String code = code(body, null, false);
        if (code == null) {
            return fail(codeProblem(body, null, false));
        }
        String firstName = requiredText(body, "firstName", null, false);
        if (firstName == null) {
            return fail("First name is required");
        }
        String lastName = requiredText(body, "lastName", null, false);
        if (lastName == null) {
            return fail("Last name is required");
        }
        String displayName = requiredText(body, "displayName", null, false);
        if (displayName == null) {
            return fail("Display name is required");
        }
        String gender = choice(body, "gender", GENDERS, null, false);
        if (gender == null) {
            return fail("Gender is not recognised");
        }
        String status = status(body, "active");
        if (status == null) {
            return fail("Status is not recognised");
        }
        String registrationNumber = requiredText(body, "registrationNumber", null, false);
        if (registrationNumber == null) {
            return fail("Registration number is required");
        }
        String qualification = requiredText(body, "qualification", null, false);
        if (qualification == null) {
            return fail("Qualification is required");
        }
        String specialization = requiredText(body, "specialization", null, false);
        if (specialization == null) {
            return fail("Specialization is required");
        }
        String workplaceName = requiredText(body, "workplaceName", null, false);
        if (workplaceName == null) {
            return fail("Workplace name is required");
        }
        String city = requiredText(body, "city", null, false);
        if (city == null) {
            return fail("City is required");
        }
        String state = region(body, "state", null, true);
        if (state == null) {
            return fail("State is not recognised");
        }
        String pin = pin(body, null, false);
        if (pin == null) {
            return fail("PIN code is invalid");
        }
        List<Window> windows = windows(body, null, true);
        if (windows == null) {
            return fail(windowProblem(body, null, true));
        }
        String optionalProblem = optionalProblem(body);
        if (optionalProblem != null) {
            return fail(optionalProblem);
        }
        Integer years = years(body, null, false);
        if (years == Years.INVALID) {
            return fail("Years of experience is invalid");
        }
        String primary = phone(body, "primaryMobile", null, true);
        if (primary == null) {
            return fail(phoneProblem(body, "primaryMobile", true));
        }
        String alternate = phone(body, "alternateMobile", null, false);
        if (alternate == PhoneMark.INVALID) {
            return fail("Mobile number is invalid");
        }
        String whatsapp = phone(body, "whatsapp", null, false);
        if (whatsapp == PhoneMark.INVALID) {
            return fail("Mobile number is invalid");
        }
        String workplacePhone = phone(body, "workplacePhone", null, false);
        if (workplacePhone == PhoneMark.INVALID) {
            return fail("Mobile number is invalid");
        }
        List<DocumentChange> changes = documentChanges(body);
        if (changes == null) {
            return fail("Verification status is not recognised");
        }
        String departmentProblem = departmentProblem(body);
        if (departmentProblem != null) {
            return fail(departmentProblem);
        }
        return new Prepared(
                new Values(
                        code,
                        firstName,
                        lastName,
                        displayName,
                        gender,
                        status,
                        registrationNumber,
                        optional(body, "registrationCouncil", null, false),
                        region(body, "registrationState", null, false),
                        qualification,
                        specialization,
                        optional(body, "subSpecialization", null, false),
                        years,
                        primary,
                        alternate,
                        email(body, null, false),
                        whatsapp,
                        choice(body, "relationshipStatus", RELATIONSHIPS, null, false),
                        optional(body, "notes", null, false),
                        workplaceName,
                        choice(body, "workplaceType", WORKPLACES, null, false),
                        optional(body, "address", null, false),
                        city,
                        state,
                        pin,
                        workplacePhone,
                        windows,
                        departmentId(body, null, false)),
                changes,
                null);
    }

    public static Prepared prepareUpdate(JsonNode body, Values current) {
        if (body == null || !body.isObject()) {
            return new Prepared(current, List.of(), null);
        }
        String codeProblem = codeProblem(body, current.code(), true);
        if (codeProblem != null) {
            return fail(codeProblem);
        }
        if (present(body, "firstName") && requiredText(body, "firstName", current.firstName(), true) == null) {
            return fail("First name is required");
        }
        if (present(body, "lastName") && requiredText(body, "lastName", current.lastName(), true) == null) {
            return fail("Last name is required");
        }
        if (present(body, "displayName") && requiredText(body, "displayName", current.displayName(), true) == null) {
            return fail("Display name is required");
        }
        if (present(body, "gender") && choice(body, "gender", GENDERS, current.gender(), true) == null) {
            return fail("Gender is not recognised");
        }
        if (present(body, "status") && status(body, current.status()) == null) {
            return fail("Status is not recognised");
        }
        if (present(body, "registrationNumber")
                && requiredText(body, "registrationNumber", current.registrationNumber(), true) == null) {
            return fail("Registration number is required");
        }
        if (present(body, "qualification")
                && requiredText(body, "qualification", current.qualification(), true) == null) {
            return fail("Qualification is required");
        }
        if (present(body, "specialization")
                && requiredText(body, "specialization", current.specialization(), true) == null) {
            return fail("Specialization is required");
        }
        if (present(body, "workplaceName")
                && requiredText(body, "workplaceName", current.workplaceName(), true) == null) {
            return fail("Workplace name is required");
        }
        if (present(body, "city") && requiredText(body, "city", current.city(), true) == null) {
            return fail("City is required");
        }
        if (present(body, "state") && region(body, "state", current.state(), true) == null) {
            return fail("State is not recognised");
        }
        if (present(body, "registrationState")
                && region(body, "registrationState", current.registrationState(), false) == null
                && text(body, "registrationState").length() > 0) {
            return fail("State is not recognised");
        }
        if (present(body, "pinCode") && pin(body, current.pinCode(), true) == null) {
            return fail("PIN code is invalid");
        }
        if (body.has("windows")) {
            String windowProblem = windowProblem(body, current.windows(), true);
            if (windowProblem != null) {
                return fail(windowProblem);
            }
        }
        String optionalProblem = optionalProblem(body);
        if (optionalProblem != null) {
            return fail(optionalProblem);
        }
        Integer years = years(body, current.yearsExperience(), true);
        if (years == Years.INVALID) {
            return fail("Years of experience is invalid");
        }
        if (present(body, "primaryMobile") && phone(body, "primaryMobile", current.primaryMobile(), true) == null) {
            return fail(phoneProblem(body, "primaryMobile", true));
        }
        if (phone(body, "alternateMobile", current.alternateMobile(), false) == PhoneMark.INVALID) {
            return fail("Mobile number is invalid");
        }
        if (phone(body, "whatsapp", current.whatsapp(), false) == PhoneMark.INVALID) {
            return fail("Mobile number is invalid");
        }
        if (phone(body, "workplacePhone", current.workplacePhone(), false) == PhoneMark.INVALID) {
            return fail("Mobile number is invalid");
        }
        List<DocumentChange> changes = documentChanges(body);
        if (changes == null) {
            return fail("Verification status is not recognised");
        }
        String departmentProblem = departmentProblem(body);
        if (departmentProblem != null) {
            return fail(departmentProblem);
        }
        return new Prepared(
                new Values(
                        code(body, current.code(), true),
                        requiredText(body, "firstName", current.firstName(), true),
                        requiredText(body, "lastName", current.lastName(), true),
                        requiredText(body, "displayName", current.displayName(), true),
                        choice(body, "gender", GENDERS, current.gender(), true),
                        status(body, current.status()),
                        requiredText(body, "registrationNumber", current.registrationNumber(), true),
                        optional(body, "registrationCouncil", current.registrationCouncil(), true),
                        blankRegion(body, "registrationState", current.registrationState()),
                        requiredText(body, "qualification", current.qualification(), true),
                        requiredText(body, "specialization", current.specialization(), true),
                        optional(body, "subSpecialization", current.subSpecialization(), true),
                        years,
                        phone(body, "primaryMobile", current.primaryMobile(), true),
                        emptyPhone(body, "alternateMobile", current.alternateMobile()),
                        email(body, current.email(), true),
                        emptyPhone(body, "whatsapp", current.whatsapp()),
                        choice(body, "relationshipStatus", RELATIONSHIPS, current.relationshipStatus(), true),
                        optional(body, "notes", current.notes(), true),
                        requiredText(body, "workplaceName", current.workplaceName(), true),
                        choice(body, "workplaceType", WORKPLACES, current.workplaceType(), true),
                        optional(body, "address", current.address(), true),
                        requiredText(body, "city", current.city(), true),
                        region(body, "state", current.state(), true),
                        pin(body, current.pinCode(), true),
                        emptyPhone(body, "workplacePhone", current.workplacePhone()),
                        body.has("windows") ? windows(body, current.windows(), true) : current.windows(),
                        departmentId(body, current.departmentId(), true)),
                changes,
                null);
    }

    public static String files(Upload photo, List<DocumentUpload> documents) {
        if (present(photo)) {
            String problem = file(photo, PHOTOS, PHOTO_MAX);
            if (problem != null) {
                return problem;
            }
        }
        if (documents == null) {
            return null;
        }
        for (DocumentUpload document : documents) {
            if (document == null
                    || document.documentType() == null
                    || document.documentType().isBlank()) {
                return "Document type is required";
            }
            if (document.documentType().trim().length() > DOCUMENT_TYPE_MAX) {
                return "Document type is required";
            }
            String status = document.verificationStatus();
            if (status != null && !status.isBlank() && !VERIFICATION.contains(status.trim())) {
                return "Verification status is not recognised";
            }
            if (!present(document.file())) {
                return "File type is not allowed";
            }
            String problem = file(document.file(), DOCUMENTS, DOCUMENT_MAX);
            if (problem != null) {
                return problem;
            }
        }
        return null;
    }

    public static String verification(String status) {
        if (status == null || status.isBlank()) {
            return "pending";
        }
        String trimmed = status.trim();
        return VERIFICATION.contains(trimmed) ? trimmed : null;
    }

    public static String media(String contentType) {
        if (contentType == null) {
            return "";
        }
        String base = contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
        if ("image/jpg".equals(base)) {
            return "image/jpeg";
        }
        return base;
    }

    public static String codeKey(String code) {
        return code == null ? "" : code.trim().toLowerCase(Locale.ROOT);
    }

    private static String departmentProblem(JsonNode body) {
        if (body == null
                || !body.has("departmentId")
                || body.get("departmentId").isNull()) {
            return null;
        }
        String value = body.get("departmentId").asText("").trim();
        if (value.isEmpty()) {
            return null;
        }
        try {
            UUID.fromString(value);
            return null;
        } catch (IllegalArgumentException exception) {
            return "Department was not found";
        }
    }

    private static UUID departmentId(JsonNode body, UUID current, boolean updating) {
        if (body == null || !body.has("departmentId")) {
            return updating ? current : null;
        }
        JsonNode node = body.get("departmentId");
        if (node.isNull()) {
            return null;
        }
        String value = node.asText("").trim();
        if (value.isEmpty()) {
            return null;
        }
        return UUID.fromString(value);
    }

    private static Prepared fail(String problem) {
        return new Prepared(null, List.of(), problem);
    }

    private static String codeProblem(JsonNode body, String current, boolean updating) {
        if (updating && !present(body, "code")) {
            return null;
        }
        String value = text(body, "code");
        if (value.isEmpty()) {
            return "Doctor code is required";
        }
        if (value.length() > CODE_MAX) {
            return "Doctor code is too long";
        }
        return null;
    }

    private static String code(JsonNode body, String current, boolean updating) {
        if (codeProblem(body, current, updating) != null) {
            return null;
        }
        if (updating && !present(body, "code")) {
            return current;
        }
        return text(body, "code");
    }

    private static String optionalProblem(JsonNode body) {
        if (present(body, "email")) {
            String value = text(body, "email");
            if (!value.isEmpty()
                    && (value.length() > EMAIL_MAX || !EMAIL.matcher(value).matches())) {
                return "Email is invalid";
            }
        }
        if (present(body, "workplaceType")) {
            String value = text(body, "workplaceType");
            if (!value.isEmpty() && !WORKPLACES.contains(value)) {
                return "Workplace type is not recognised";
            }
        }
        if (present(body, "relationshipStatus")) {
            String value = text(body, "relationshipStatus");
            if (!value.isEmpty() && !RELATIONSHIPS.contains(value)) {
                return "Relationship status is not recognised";
            }
        }
        if (present(body, "registrationState")) {
            String value = text(body, "registrationState");
            if (!value.isEmpty() && !PharmacyRules.REGIONS.contains(value)) {
                return "State is not recognised";
            }
        }
        return null;
    }

    private static String requiredText(JsonNode body, String field, String current, boolean updating) {
        if (updating && !present(body, field)) {
            return current;
        }
        String value = text(body, field);
        return value.isEmpty() ? null : value;
    }

    private static String optional(JsonNode body, String field, String current, boolean updating) {
        if (!present(body, field)) {
            return updating ? current : null;
        }
        String value = text(body, field);
        return value.isEmpty() ? null : value;
    }

    private static String choice(JsonNode body, String field, Set<String> allowed, String current, boolean updating) {
        if (!present(body, field)) {
            return updating ? current : null;
        }
        String value = text(body, field);
        if (value.isEmpty()) {
            return null;
        }
        return allowed.contains(value) ? value : null;
    }

    private static String status(JsonNode body, String fallback) {
        if (!present(body, "status")) {
            return fallback;
        }
        String value = text(body, "status");
        return STATUSES.contains(value) ? value : null;
    }

    private static String region(JsonNode body, String field, String current, boolean required) {
        if (!present(body, field)) {
            return required ? current : current;
        }
        String value = text(body, field);
        if (value.isEmpty()) {
            return required ? null : null;
        }
        return PharmacyRules.REGIONS.contains(value) ? value : null;
    }

    private static String blankRegion(JsonNode body, String field, String current) {
        if (!present(body, field)) {
            return current;
        }
        String value = text(body, field);
        if (value.isEmpty()) {
            return null;
        }
        return PharmacyRules.REGIONS.contains(value) ? value : current;
    }

    private static String pin(JsonNode body, String current, boolean updating) {
        if (updating && !present(body, "pinCode")) {
            return current;
        }
        String value = text(body, "pinCode");
        return PIN.matcher(value).matches() ? value : null;
    }

    private static String phone(JsonNode body, String field, String current, boolean required) {
        if (!present(body, field)) {
            return required ? current : current;
        }
        String value = text(body, field);
        if (value.isEmpty()) {
            return required ? null : null;
        }
        String normalized = PhoneNumbers.normalize(value);
        if (normalized == null) {
            return required ? null : PhoneMark.INVALID;
        }
        return normalized;
    }

    private static String emptyPhone(JsonNode body, String field, String current) {
        String value = phone(body, field, current, false);
        return value == PhoneMark.INVALID ? current : value;
    }

    private static String phoneProblem(JsonNode body, String field, boolean required) {
        String value = text(body, field);
        if (value.isEmpty()) {
            return required ? "Primary mobile is required" : "Mobile number is invalid";
        }
        return "Mobile number is invalid";
    }

    private static String email(JsonNode body, String current, boolean updating) {
        if (!present(body, "email")) {
            return updating ? current : null;
        }
        String value = text(body, "email");
        return value.isEmpty() ? null : value;
    }

    private static Integer years(JsonNode body, Integer current, boolean updating) {
        if (!present(body, "yearsExperience")) {
            return updating ? current : null;
        }
        JsonNode node = body.get("yearsExperience");
        if (node.isNull()) {
            return null;
        }
        String raw = node.isNumber() ? node.asText() : node.asText().trim();
        if (raw.isEmpty()) {
            return null;
        }
        try {
            int value = Integer.parseInt(raw);
            if (value < 0 || value > 99) {
                return Years.INVALID;
            }
            return value;
        } catch (NumberFormatException exception) {
            return Years.INVALID;
        }
    }

    private static List<Window> windows(JsonNode body, List<Window> current, boolean required) {
        if (windowProblem(body, current, required) != null) {
            return null;
        }
        if (!body.has("windows")) {
            return current;
        }
        List<Window> windows = new ArrayList<>();
        for (JsonNode node : body.get("windows")) {
            windows.add(new Window(
                    text(node, "type"),
                    days(node.get("days")),
                    text(node, "start"),
                    text(node, "end"),
                    new BigDecimal(feeText(node.get("fee")))));
        }
        return List.copyOf(windows);
    }

    private static String windowProblem(JsonNode body, List<Window> current, boolean required) {
        if (!body.has("windows") || body.get("windows").isNull()) {
            if (required && (current == null || current.isEmpty())) {
                return "A consultation window is required";
            }
            return null;
        }
        JsonNode nodes = body.get("windows");
        if (!nodes.isArray() || nodes.isEmpty()) {
            return "A consultation window is required";
        }
        for (JsonNode node : nodes) {
            if (node == null || !node.isObject()) {
                return "Consultation type is not recognised";
            }
            String type = text(node, "type");
            if (!TYPES.contains(type)) {
                return "Consultation type is not recognised";
            }
            List<String> days = days(node.get("days"));
            if (days == null) {
                return "Consultation day is not recognised";
            }
            String start = text(node, "start");
            String end = text(node, "end");
            if (!TIME.matcher(start).matches() || !TIME.matcher(end).matches() || start.compareTo(end) >= 0) {
                return "Consultation time is invalid";
            }
            if (feeText(node.get("fee")) == null) {
                return "Consultation fee is invalid";
            }
        }
        return null;
    }

    private static List<String> days(JsonNode node) {
        if (node == null || !node.isArray() || node.isEmpty()) {
            return null;
        }
        List<String> days = new ArrayList<>();
        for (JsonNode day : node) {
            String value = day.asText("").trim().toLowerCase(Locale.ROOT);
            if (!DAYS.contains(value) || days.contains(value)) {
                if (!DAYS.contains(value)) {
                    return null;
                }
                continue;
            }
            days.add(value);
        }
        return days.isEmpty() ? null : List.copyOf(days);
    }

    private static String feeText(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        String raw = node.isNumber()
                ? node.decimalValue().stripTrailingZeros().toPlainString()
                : node.asText().trim();
        if (!FEE.matcher(raw).matches()) {
            return null;
        }
        return raw;
    }

    private static List<DocumentChange> documentChanges(JsonNode body) {
        if (!present(body, "documents")) {
            return List.of();
        }
        JsonNode nodes = body.get("documents");
        if (!nodes.isArray()) {
            return null;
        }
        List<DocumentChange> changes = new ArrayList<>();
        for (JsonNode node : nodes) {
            if (node == null || !node.isObject() || !node.hasNonNull("id")) {
                continue;
            }
            UUID id;
            try {
                id = UUID.fromString(node.get("id").asText());
            } catch (IllegalArgumentException exception) {
                return null;
            }
            String status = text(node, "verificationStatus");
            if (!VERIFICATION.contains(status)) {
                return null;
            }
            changes.add(new DocumentChange(id, status));
        }
        return List.copyOf(changes);
    }

    private static String file(Upload upload, Set<String> allowed, int max) {
        if (!allowed.contains(media(upload.contentType()))) {
            return "File type is not allowed";
        }
        if (upload.body().length > max) {
            return "File is too large";
        }
        return null;
    }

    private static boolean present(Upload upload) {
        return upload != null && upload.body() != null && upload.body().length > 0;
    }

    private static boolean present(JsonNode body, String field) {
        return body != null && body.has(field) && !body.get(field).isNull();
    }

    private static String text(JsonNode body, String field) {
        if (body == null || !body.has(field) || body.get(field).isNull()) {
            return "";
        }
        return body.get(field).asText().trim();
    }

    private static final class PhoneMark {
        private static final String INVALID = "\u0000invalid";

        private PhoneMark() {}
    }

    private static final class Years {
        private static final Integer INVALID = Integer.MIN_VALUE;

        private Years() {}
    }
}
