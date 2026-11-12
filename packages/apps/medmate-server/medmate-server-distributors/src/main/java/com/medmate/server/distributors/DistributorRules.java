package com.medmate.server.distributors;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

public final class DistributorRules {

    public static final String READ = "distributors:read";
    public static final String CREATE = "distributors:create";
    public static final String UPDATE = "distributors:update";
    public static final String DELETE = "distributors:delete";
    public static final String PAY = "distributors:pay";

    public static final List<String> TERMS =
            List.of("Advance", "On delivery", "7 days credit", "15 days credit", "30 days credit", "45 days credit");

    public static final List<String> MODES = List.of("cash", "upi", "card", "bank_transfer");

    private static final Pattern GSTIN = Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$");

    private DistributorRules() {}

    public static String nextCode(String prefix, List<String> codes) {
        int max = 0;
        String head = prefix + "-";
        if (codes != null) {
            for (String code : codes) {
                Integer number = codeNumber(head, code);
                if (number != null && number > max) {
                    max = number;
                }
            }
        }
        return formatCode(prefix, max + 1);
    }

    public static String formatCode(String prefix, int number) {
        if (number < 1000) {
            return String.format(Locale.ROOT, "%s-%03d", prefix, number);
        }
        return prefix + "-" + number;
    }

    public record Line(String type, int amount) {}

    public record Values(
            String name,
            String contactPerson,
            String phone,
            String email,
            String gstin,
            String drugLicenceNumber,
            String address,
            String city,
            String state,
            String paymentTerms,
            int openingBalance,
            boolean active,
            boolean showInPurchases) {}

    public record Prepared(Values values, String problem, boolean needsUpdate, boolean setsInactive) {

        static Prepared problem(String detail) {
            return new Prepared(null, detail, false, false);
        }
    }

    public record Payment(int amount, String mode, String note, String problem) {}

    public static int outstanding(int opening, List<Line> lines) {
        long total = opening;
        if (lines != null) {
            for (Line line : lines) {
                if (line == null) {
                    continue;
                }
                if ("purchase".equals(line.type())) {
                    total += line.amount();
                } else if ("payment".equals(line.type()) || "return".equals(line.type())) {
                    total -= line.amount();
                }
            }
        }
        if (total > Integer.MAX_VALUE) {
            return Integer.MAX_VALUE;
        }
        if (total < Integer.MIN_VALUE) {
            return Integer.MIN_VALUE;
        }
        return (int) total;
    }

    public static String reject(String type, int amount, int owed) {
        if (!List.of("purchase", "payment", "return").contains(type)) {
            return "Transaction type is not recognised";
        }
        if (amount < 1) {
            return "payment".equals(type) ? "Payment must be at least 1" : "Amount must be at least 1";
        }
        if ("payment".equals(type) && amount > owed) {
            return "Payment is more than the outstanding";
        }
        if ("return".equals(type) && amount > owed) {
            return "Return is more than the outstanding";
        }
        return null;
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
        String terms = terms(body, false);
        if (terms == null) {
            return Prepared.problem("Payment terms are not recognised");
        }
        if (!present(body, "paymentTerms")) {
            terms = "30 days credit";
        }
        Integer opening = money(body, "openingBalance", 0);
        if (opening == null) {
            return Prepared.problem("Outstanding must be zero or more");
        }
        Boolean active = flag(body, "active");
        if (active == null && present(body, "active")) {
            return Prepared.problem("Status is not recognised");
        }
        if (active == null) {
            active = true;
        }
        Boolean listed = flag(body, "showInPurchases");
        if (listed == null && present(body, "showInPurchases")) {
            return Prepared.problem("Show in purchases is not recognised");
        }
        if (listed == null) {
            listed = true;
        }
        String gstin = gstin(body);
        if (gstinProblem(body)) {
            return Prepared.problem("GSTIN is invalid");
        }
        Values values = values(body, name, phone, terms, opening, active, listed, gstin);
        return new Prepared(values, null, false, !active);
    }

    public static Prepared prepareUpdate(JsonNode body, Values current, boolean hasLines) {
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
        String terms = current.paymentTerms();
        if (present(body, "paymentTerms")) {
            terms = terms(body, true);
            if (terms == null) {
                return Prepared.problem("Payment terms are not recognised");
            }
        }
        int opening = current.openingBalance();
        if (present(body, "openingBalance")) {
            Integer parsed = money(body, "openingBalance", null);
            if (parsed == null) {
                return Prepared.problem("Outstanding must be zero or more");
            }
            if (hasLines && parsed != current.openingBalance()) {
                return Prepared.problem("Opening balance is locked");
            }
            opening = parsed;
        }
        boolean active = current.active();
        if (present(body, "active")) {
            Boolean parsed = flag(body, "active");
            if (parsed == null) {
                return Prepared.problem("Status is not recognised");
            }
            active = parsed;
        }
        boolean listed = current.showInPurchases();
        if (present(body, "showInPurchases")) {
            Boolean parsed = flag(body, "showInPurchases");
            if (parsed == null) {
                return Prepared.problem("Show in purchases is not recognised");
            }
            listed = parsed;
        }
        String gstin = current.gstin();
        if (present(body, "gstin")) {
            if (gstinProblem(body)) {
                return Prepared.problem("GSTIN is invalid");
            }
            gstin = gstin(body);
        }
        Values values = new Values(
                name,
                present(body, "contactPerson") ? optional(body, "contactPerson") : current.contactPerson(),
                phone,
                present(body, "email") ? optional(body, "email") : current.email(),
                gstin,
                present(body, "drugLicenceNumber")
                        ? upperOptional(body, "drugLicenceNumber")
                        : current.drugLicenceNumber(),
                present(body, "address") ? optional(body, "address") : current.address(),
                present(body, "city") ? optional(body, "city") : current.city(),
                present(body, "state") ? optional(body, "state") : current.state(),
                terms,
                opening,
                active,
                listed);
        boolean setsInactive = !active && current.active();
        boolean other = otherField(body) || (present(body, "active") && !setsInactive);
        return new Prepared(values, null, !setsInactive || other, setsInactive);
    }

    public static Payment preparePayment(JsonNode body, int owed) {
        if (body == null || !body.isObject()) {
            return new Payment(0, null, null, "Payment must be at least 1");
        }
        Integer amount = money(body, "amount", null);
        if (!present(body, "amount") || amount == null || amount < 1) {
            return new Payment(0, null, null, "Payment must be at least 1");
        }
        String rejected = reject("payment", amount, owed);
        if (rejected != null) {
            return new Payment(amount, null, null, rejected);
        }
        if (!present(body, "mode") || !MODES.contains(text(body, "mode"))) {
            return new Payment(amount, null, null, "Payment mode is not recognised");
        }
        return new Payment(amount, text(body, "mode"), optional(body, "note"), null);
    }

    private static Values values(
            JsonNode body,
            String name,
            String phone,
            String terms,
            int opening,
            boolean active,
            boolean listed,
            String gstin) {
        return new Values(
                name,
                optional(body, "contactPerson"),
                phone,
                optional(body, "email"),
                gstin,
                upperOptional(body, "drugLicenceNumber"),
                optional(body, "address"),
                optional(body, "city"),
                optional(body, "state"),
                terms,
                opening,
                active,
                listed);
    }

    private static boolean otherField(JsonNode body) {
        for (String field : List.of(
                "name",
                "phone",
                "contactPerson",
                "email",
                "gstin",
                "drugLicenceNumber",
                "address",
                "city",
                "state",
                "paymentTerms",
                "openingBalance",
                "showInPurchases")) {
            if (present(body, field)) {
                return true;
            }
        }
        return false;
    }

    private static String terms(JsonNode body, boolean required) {
        if (!present(body, "paymentTerms")) {
            return required ? null : "";
        }
        String value = text(body, "paymentTerms");
        if (!TERMS.contains(value)) {
            return null;
        }
        return value;
    }

    private static boolean gstinProblem(JsonNode body) {
        if (!present(body, "gstin")) {
            return false;
        }
        String value = text(body, "gstin").toUpperCase(Locale.ROOT);
        return !value.isEmpty() && !GSTIN.matcher(value).matches();
    }

    private static String gstin(JsonNode body) {
        if (!present(body, "gstin")) {
            return null;
        }
        String value = text(body, "gstin").toUpperCase(Locale.ROOT);
        return value.isEmpty() ? null : value;
    }

    private static String upperOptional(JsonNode body, String field) {
        String value = optional(body, field);
        return value == null ? null : value.toUpperCase(Locale.ROOT);
    }

    private static Integer money(JsonNode body, String field, Integer fallback) {
        if (!present(body, field)) {
            return fallback;
        }
        JsonNode node = body.get(field);
        if (!node.isIntegralNumber()) {
            return null;
        }
        long value = node.longValue();
        if (value < 0 || value > Integer.MAX_VALUE) {
            return null;
        }
        return (int) value;
    }

    private static Boolean flag(JsonNode body, String field) {
        if (!present(body, field) || !body.get(field).isBoolean()) {
            return null;
        }
        return body.get(field).booleanValue();
    }

    private static String required(JsonNode body, String field) {
        if (!present(body, field) || text(body, field).isEmpty()) {
            return null;
        }
        return text(body, field);
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

    private static Integer codeNumber(String head, String code) {
        if (code == null || !code.startsWith(head)) {
            return null;
        }
        try {
            int number = Integer.parseInt(code.substring(head.length()));
            return number > 0 ? number : null;
        } catch (NumberFormatException exception) {
            return null;
        }
    }
}
