package com.medmate.server.employees;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class EmployeeRules {

    public static final String READ = "employees:read";
    public static final String CREATE = "employees:create";
    public static final String UPDATE = "employees:update";
    public static final String DELETE = "employees:delete";

    public static final int PHOTO_MAX = 2 * 1024 * 1024;
    public static final int DOCUMENT_MAX = 5 * 1024 * 1024;

    public static final List<String> POSITIONS = List.of(
            "Owner",
            "Manager",
            "Pharmacist",
            "Cashier",
            "Delivery Executive",
            "Store Helper",
            "Accountant",
            "Housekeeping");

    public static final List<String> EMPLOYMENT = List.of("Full-time", "Part-time", "Contract");

    public static final List<String> BLOOD_GROUPS =
            List.of("A+", "A\u2212", "B+", "B\u2212", "AB+", "AB\u2212", "O+", "O\u2212");

    public static final List<String> DOCUMENT_LABELS = List.of(
            "Aadhaar card",
            "PAN card",
            "Pharmacist licence",
            "Appointment letter",
            "Educational certificate",
            "Experience letter",
            "Bank passbook",
            "Address proof",
            "Photograph",
            "Other");

    private static final Set<String> PHOTOS = Set.of("image/jpeg", "image/png");
    private static final Set<String> DOCUMENTS = Set.of("image/jpeg", "image/png", "application/pdf");
    private static final Pattern IFSC = Pattern.compile("^[A-Z]{4}0[A-Z0-9]{6}$");
    private static final Pattern DATE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");

    private EmployeeRules() {}

    public static String nextCode(List<String> codes) {
        int max = 0;
        if (codes != null) {
            for (String code : codes) {
                Integer number = codeNumber(code);
                if (number != null && number > max) {
                    max = number;
                }
            }
        }
        return formatCode(max + 1);
    }

    public static String formatCode(int number) {
        if (number < 1000) {
            return String.format(Locale.ROOT, "EMP-%03d", number);
        }
        return "EMP-" + number;
    }

    public record Upload(String fileName, String contentType, byte[] body) {}

    public record DocumentUpload(String label, Upload file) {}

    public record Values(
            String name,
            String position,
            String department,
            String phone,
            String email,
            String address,
            String dob,
            String joinedOn,
            String employment,
            int salary,
            String status,
            String pan,
            String aadhaar,
            String bankName,
            String accountName,
            String accountNumber,
            String ifsc,
            String upi,
            String emergencyName,
            String emergencyPhone,
            String note,
            String bloodGroup) {}

    public record Prepared(Values values, String problem, boolean needsUpdate, boolean setsInactive) {

        static Prepared problem(String detail) {
            return new Prepared(null, detail, false, false);
        }
    }

    public static Prepared prepareCreate(JsonNode body) {
        if (body == null || !body.isObject()) {
            return Prepared.problem("Name is required");
        }
        String name = required(body, "name");
        if (name == null) {
            return Prepared.problem("Name is required");
        }
        String phone = required(body, "phone");
        if (phone == null) {
            return Prepared.problem("Phone is required");
        }
        String position = choice(body, "position", POSITIONS, true);
        if (position == null) {
            return Prepared.problem("Position is not recognised");
        }
        String employment = choice(body, "employment", EMPLOYMENT, false);
        if (employment == null) {
            return Prepared.problem("Employment type is not recognised");
        }
        if (!present(body, "employment")) {
            employment = "Full-time";
        }
        String status = choice(body, "status", List.of("active", "inactive"), false);
        if (status == null) {
            return Prepared.problem("Status is not recognised");
        }
        if (!present(body, "status")) {
            status = "active";
        }
        Integer salary = salary(body, 0);
        if (salary == null) {
            return Prepared.problem("Salary must be zero or more");
        }
        if (bloodProblem(body)) {
            return Prepared.problem("Blood group is not recognised");
        }
        String blood = blood(body);
        String dob = date(body, "dob");
        if (dateProblem(body, "dob")) {
            return Prepared.problem("Date is invalid");
        }
        String joinedOn = date(body, "joinedOn");
        if (dateProblem(body, "joinedOn")) {
            return Prepared.problem("Date is invalid");
        }
        String ifsc = ifsc(body);
        if (ifscProblem(body)) {
            return Prepared.problem("Invalid IFSC");
        }
        Values values = new Values(
                name,
                position,
                optional(body, "department"),
                phone,
                optional(body, "email"),
                optional(body, "address"),
                dob,
                joinedOn,
                employment,
                salary,
                status,
                optional(body, "pan"),
                optional(body, "aadhaar"),
                optional(body, "bankName"),
                optional(body, "accountName"),
                optional(body, "accountNumber"),
                ifsc,
                optional(body, "upi"),
                optional(body, "emergencyName"),
                optional(body, "emergencyPhone"),
                optional(body, "note"),
                blood);
        return new Prepared(values, null, false, "inactive".equals(status));
    }

    public static Prepared prepareUpdate(JsonNode body, Values current) {
        if (body == null || !body.isObject()) {
            return new Prepared(current, null, true, false);
        }
        String name = current.name();
        if (present(body, "name")) {
            name = text(body, "name");
            if (name.isEmpty()) {
                return Prepared.problem("Name is required");
            }
        }
        String phone = current.phone();
        if (present(body, "phone")) {
            phone = text(body, "phone");
            if (phone.isEmpty()) {
                return Prepared.problem("Phone is required");
            }
        }
        String position = current.position();
        if (present(body, "position")) {
            position = choice(body, "position", POSITIONS, true);
            if (position == null) {
                return Prepared.problem("Position is not recognised");
            }
        }
        String employment = current.employment();
        if (present(body, "employment")) {
            employment = choice(body, "employment", EMPLOYMENT, true);
            if (employment == null) {
                return Prepared.problem("Employment type is not recognised");
            }
        }
        String status = current.status();
        if (present(body, "status")) {
            status = choice(body, "status", List.of("active", "inactive"), true);
            if (status == null) {
                return Prepared.problem("Status is not recognised");
            }
        }
        int salary = current.salary();
        if (present(body, "salary")) {
            Integer parsed = salary(body, null);
            if (parsed == null) {
                return Prepared.problem("Salary must be zero or more");
            }
            salary = parsed;
        }
        String blood = current.bloodGroup();
        if (present(body, "bloodGroup")) {
            if (bloodProblem(body)) {
                return Prepared.problem("Blood group is not recognised");
            }
            blood = blood(body);
        }
        String dob = current.dob();
        if (present(body, "dob")) {
            if (dateProblem(body, "dob")) {
                return Prepared.problem("Date is invalid");
            }
            dob = date(body, "dob");
        }
        String joinedOn = current.joinedOn();
        if (present(body, "joinedOn")) {
            if (dateProblem(body, "joinedOn")) {
                return Prepared.problem("Date is invalid");
            }
            joinedOn = date(body, "joinedOn");
        }
        String ifsc = current.ifsc();
        if (present(body, "ifsc")) {
            if (ifscProblem(body)) {
                return Prepared.problem("Invalid IFSC");
            }
            ifsc = ifsc(body);
        }
        Values values = new Values(
                name,
                position,
                present(body, "department") ? optional(body, "department") : current.department(),
                phone,
                present(body, "email") ? optional(body, "email") : current.email(),
                present(body, "address") ? optional(body, "address") : current.address(),
                dob,
                joinedOn,
                employment,
                salary,
                status,
                present(body, "pan") ? optional(body, "pan") : current.pan(),
                present(body, "aadhaar") ? optional(body, "aadhaar") : current.aadhaar(),
                present(body, "bankName") ? optional(body, "bankName") : current.bankName(),
                present(body, "accountName") ? optional(body, "accountName") : current.accountName(),
                present(body, "accountNumber") ? optional(body, "accountNumber") : current.accountNumber(),
                ifsc,
                present(body, "upi") ? optional(body, "upi") : current.upi(),
                present(body, "emergencyName") ? optional(body, "emergencyName") : current.emergencyName(),
                present(body, "emergencyPhone") ? optional(body, "emergencyPhone") : current.emergencyPhone(),
                present(body, "note") ? optional(body, "note") : current.note(),
                blood);
        boolean setsInactive = "inactive".equals(status) && !"inactive".equals(current.status());
        boolean other = otherField(body) || statusKeepsUpdate(body, current.status());
        return new Prepared(values, null, !setsInactive || other, setsInactive);
    }

    public static String files(Upload photo, List<DocumentUpload> documents) {
        if (present(photo)) {
            String problem = file(photo, PHOTOS);
            if (problem != null) {
                return problem;
            }
        }
        if (documents == null) {
            return null;
        }
        for (DocumentUpload document : documents) {
            if (document == null || document.label() == null || !DOCUMENT_LABELS.contains(document.label())) {
                return "Document type is not recognised";
            }
            if (!present(document.file())) {
                return "File type is not allowed";
            }
            String problem = file(document.file(), DOCUMENTS);
            if (problem != null) {
                return problem;
            }
        }
        return null;
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

    private static boolean otherField(JsonNode body) {
        for (String field : List.of(
                "name",
                "phone",
                "position",
                "department",
                "email",
                "address",
                "dob",
                "joinedOn",
                "employment",
                "pan",
                "aadhaar",
                "bankName",
                "accountName",
                "accountNumber",
                "ifsc",
                "upi",
                "emergencyName",
                "emergencyPhone",
                "note",
                "bloodGroup")) {
            if (present(body, field)) {
                return true;
            }
        }
        return present(body, "salary");
    }

    private static boolean statusKeepsUpdate(JsonNode body, String current) {
        if (!present(body, "status")) {
            return false;
        }
        String status = text(body, "status");
        return !"inactive".equals(status) || "inactive".equals(current);
    }

    private static String required(JsonNode body, String field) {
        if (!present(body, field) || text(body, field).isEmpty()) {
            return null;
        }
        return text(body, field);
    }

    private static String choice(JsonNode body, String field, List<String> allowed, boolean required) {
        if (!present(body, field)) {
            return required ? null : "";
        }
        String value = text(body, field);
        if (value.isEmpty() || !allowed.contains(value)) {
            return null;
        }
        return value;
    }

    private static Integer salary(JsonNode body, Integer fallback) {
        if (!present(body, "salary")) {
            return fallback;
        }
        JsonNode node = body.get("salary");
        if (!node.isIntegralNumber()) {
            return null;
        }
        long value = node.longValue();
        if (value < 0 || value > Integer.MAX_VALUE) {
            return null;
        }
        return (int) value;
    }

    private static boolean bloodProblem(JsonNode body) {
        if (!present(body, "bloodGroup")) {
            return false;
        }
        String value = text(body, "bloodGroup");
        return !value.isEmpty() && !BLOOD_GROUPS.contains(value);
    }

    private static String blood(JsonNode body) {
        if (!present(body, "bloodGroup")) {
            return null;
        }
        String value = text(body, "bloodGroup");
        return value.isEmpty() ? null : value;
    }

    private static boolean dateProblem(JsonNode body, String field) {
        if (!present(body, field)) {
            return false;
        }
        String value = text(body, field);
        if (value.isEmpty()) {
            return false;
        }
        if (!DATE.matcher(value).matches()) {
            return true;
        }
        try {
            LocalDate.parse(value);
            return false;
        } catch (DateTimeParseException exception) {
            return true;
        }
    }

    private static String date(JsonNode body, String field) {
        if (!present(body, field)) {
            return null;
        }
        String value = text(body, field);
        return value.isEmpty() ? null : value;
    }

    private static boolean ifscProblem(JsonNode body) {
        if (!present(body, "ifsc")) {
            return false;
        }
        String value = text(body, "ifsc").toUpperCase(Locale.ROOT);
        return !value.isEmpty() && !IFSC.matcher(value).matches();
    }

    private static String ifsc(JsonNode body) {
        if (!present(body, "ifsc")) {
            return null;
        }
        String value = text(body, "ifsc").toUpperCase(Locale.ROOT);
        return value.isEmpty() ? null : value;
    }

    private static String optional(JsonNode body, String field) {
        if (!present(body, field)) {
            return null;
        }
        String value = text(body, field);
        return value.isEmpty() ? null : value;
    }

    private static boolean present(JsonNode body, String field) {
        return body.has(field) && !body.get(field).isNull();
    }

    private static String text(JsonNode body, String field) {
        JsonNode node = body.get(field);
        if (node == null || node.isNull()) {
            return "";
        }
        return node.asText().trim();
    }

    private static String file(Upload upload, Set<String> allowed) {
        if (!allowed.contains(media(upload.contentType()))) {
            return "File type is not allowed";
        }
        int max = allowed == PHOTOS ? PHOTO_MAX : DOCUMENT_MAX;
        if (upload.body().length > max) {
            return "File is too large";
        }
        return null;
    }

    private static boolean present(Upload upload) {
        return upload != null && upload.body() != null && upload.body().length > 0;
    }

    private static Integer codeNumber(String code) {
        if (code == null || !code.startsWith("EMP-")) {
            return null;
        }
        try {
            int number = Integer.parseInt(code.substring(4));
            return number > 0 ? number : null;
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}
