package com.medmate.server.leads;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Set;
import java.util.regex.Pattern;

public final class LeadRules {

    public static final String INVALID = "Lead is not valid";
    public static final String STATUS = "Status is not valid";
    public static final String SITE = "Site is not valid";
    public static final String FORM = "Form is not valid";
    public static final int TEXT = 200;
    public static final int LONG_TEXT = 2000;

    private static final Set<String> SITES = Set.of("nammamedmate", "medmatepharmacy");
    private static final Set<String> TYPES = Set.of("contact", "demo", "early-access", "pharmacy-partner");
    private static final Set<String> STATUSES = Set.of("new", "contacted");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern INDIAN_MOBILE = Pattern.compile("^[6-9][0-9]{9}$");

    private LeadRules() {}

    public record Draft(
            String site,
            String type,
            String name,
            String phone,
            String email,
            String pharmacyName,
            String cityPincode,
            String area,
            String city,
            String preferredTime,
            String monthlySales,
            String subject,
            String message,
            String source,
            String notes,
            String plan,
            Boolean consent) {}

    public record Parsed(Draft draft, boolean dropped, String problem) {

        static Parsed drop() {
            return new Parsed(null, true, null);
        }

        static Parsed invalid() {
            return new Parsed(null, false, INVALID);
        }

        static Parsed ok(Draft draft) {
            return new Parsed(draft, false, null);
        }
    }

    public record Named(String value, String problem) {}

    public static Parsed parse(JsonNode body) {
        if (body == null || !body.isObject()) {
            return Parsed.invalid();
        }
        String honeypot = text(body.get("companyWebsite"), TEXT);
        if (honeypot == null) {
            return Parsed.invalid();
        }
        if (!honeypot.isEmpty()) {
            return Parsed.drop();
        }
        String site = text(body.get("site"), TEXT);
        String type = text(body.get("type"), TEXT);
        if (site == null || type == null || !SITES.contains(site) || !TYPES.contains(type)) {
            return Parsed.invalid();
        }
        String name = text(body.get("name"), TEXT);
        String phone = text(body.get("phone"), TEXT);
        String email = text(body.get("email"), TEXT);
        String pharmacyName = text(body.get("pharmacyName"), TEXT);
        String cityPincode = text(body.get("cityPincode"), TEXT);
        String area = text(body.get("area"), TEXT);
        String city = text(body.get("city"), TEXT);
        String preferredTime = text(body.get("preferredTime"), TEXT);
        String monthlySales = text(body.get("monthlySales"), TEXT);
        String subject = text(body.get("subject"), TEXT);
        String message = text(body.get("message"), LONG_TEXT);
        String source = text(body.get("source"), TEXT);
        String notes = text(body.get("notes"), LONG_TEXT);
        String plan = text(body.get("plan"), TEXT);
        ConsentMark consent = consent(body.get("consent"));
        if (name == null
                || phone == null
                || email == null
                || pharmacyName == null
                || cityPincode == null
                || area == null
                || city == null
                || preferredTime == null
                || monthlySales == null
                || subject == null
                || message == null
                || source == null
                || notes == null
                || plan == null
                || consent == ConsentMark.INVALID
                || (!email.isEmpty() && !EMAIL.matcher(email).matches())) {
            return Parsed.invalid();
        }
        if (!accepted(
                site,
                type,
                name,
                phone,
                email,
                pharmacyName,
                cityPincode,
                area,
                city,
                preferredTime,
                monthlySales,
                subject,
                message,
                plan,
                consent)) {
            return Parsed.invalid();
        }
        return Parsed.ok(new Draft(
                site,
                type,
                blank(name),
                blank(phone),
                blank(email),
                blank(pharmacyName),
                blank(cityPincode),
                blank(area),
                blank(city),
                blank(preferredTime),
                blank(monthlySales),
                blank(subject),
                blank(message),
                blank(source),
                blank(notes),
                blank(plan),
                storedConsent(consent)));
    }

    public static Named statusFilter(String raw) {
        return closed(raw, STATUSES, STATUS);
    }

    public static Named siteFilter(String raw) {
        return closed(raw, SITES, SITE);
    }

    public static Named formFilter(String raw) {
        return closed(raw, TYPES, FORM);
    }

    public static Named nextStatus(JsonNode body) {
        if (body == null || !body.isObject()) {
            return new Named(null, STATUS);
        }
        String status = text(body.get("status"), TEXT);
        if (status == null || status.isEmpty() || !STATUSES.contains(status)) {
            return new Named(null, STATUS);
        }
        return new Named(status, null);
    }

    private static boolean accepted(
            String site,
            String type,
            String name,
            String phone,
            String email,
            String pharmacyName,
            String cityPincode,
            String area,
            String city,
            String preferredTime,
            String monthlySales,
            String subject,
            String message,
            String plan,
            ConsentMark consent) {
        boolean named = !name.isEmpty();
        return switch (site + ":" + type) {
            case "nammamedmate:contact" -> named && !email.isEmpty() && !subject.isEmpty() && !message.isEmpty();
            case "nammamedmate:demo" -> named
                    && !phone.isEmpty()
                    && !pharmacyName.isEmpty()
                    && !cityPincode.isEmpty()
                    && !preferredTime.isEmpty();
            case "nammamedmate:early-access" -> named
                    && !phone.isEmpty()
                    && !pharmacyName.isEmpty()
                    && !cityPincode.isEmpty()
                    && !monthlySales.isEmpty();
            case "medmatepharmacy:contact" -> named
                    && INDIAN_MOBILE.matcher(phone).matches()
                    && !subject.isEmpty()
                    && !message.isEmpty()
                    && consent == ConsentMark.YES;
            case "medmatepharmacy:pharmacy-partner" -> named
                    && INDIAN_MOBILE.matcher(phone).matches()
                    && !pharmacyName.isEmpty()
                    && !area.isEmpty()
                    && !city.isEmpty()
                    && !plan.isEmpty()
                    && !preferredTime.isEmpty()
                    && consent == ConsentMark.YES;
            default -> false;
        };
    }

    private static Named closed(String raw, Set<String> allowed, String problem) {
        if (raw == null || raw.isBlank()) {
            return new Named("", null);
        }
        String value = raw.trim();
        if (!allowed.contains(value)) {
            return new Named(null, problem);
        }
        return new Named(value, null);
    }

    private static String text(JsonNode node, int max) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return "";
        }
        if (!node.isTextual()) {
            return null;
        }
        String value = node.asText().trim();
        if (value.length() > max) {
            return null;
        }
        return value;
    }

    private static ConsentMark consent(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return ConsentMark.ABSENT;
        }
        if (!node.isBoolean()) {
            return ConsentMark.INVALID;
        }
        return node.booleanValue() ? ConsentMark.YES : ConsentMark.NO;
    }

    private static Boolean storedConsent(ConsentMark consent) {
        if (consent == ConsentMark.YES) {
            return Boolean.TRUE;
        }
        if (consent == ConsentMark.NO) {
            return Boolean.FALSE;
        }
        return null;
    }

    private static String blank(String value) {
        return value.isEmpty() ? null : value;
    }

    private enum ConsentMark {
        ABSENT,
        YES,
        NO,
        INVALID
    }
}
