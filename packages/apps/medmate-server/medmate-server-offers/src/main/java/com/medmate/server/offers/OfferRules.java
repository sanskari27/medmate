package com.medmate.server.offers;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

public final class OfferRules {

    public static final String READ = "offers:read";
    public static final String CREATE = "offers:create";
    public static final String UPDATE = "offers:update";
    public static final String DELETE = "offers:delete";

    private OfferRules() {}

    @FunctionalInterface
    public interface Products {
        boolean contains(String productId);
    }

    public record Draft(
            String title, String code, String type, BigDecimal value, String scope, String target, boolean active) {}

    public record Prepared(Draft draft, String problem) {

        static Prepared problem(String detail) {
            return new Prepared(null, detail);
        }
    }

    public static String formatCode(int number) {
        if (number < 1000) {
            return String.format(Locale.ROOT, "OFR-%03d", number);
        }
        return "OFR-" + number;
    }

    public static int itemCount(String scope, boolean targetPresent, int productCount) {
        if ("all".equals(scope)) {
            return productCount;
        }
        return targetPresent ? 1 : 0;
    }

    public static Prepared prepareCreate(JsonNode body, Products products) {
        if (body == null || !body.isObject()) {
            return Prepared.problem("Title is required");
        }
        String title = requiredText(body, "title");
        if (title == null) {
            return Prepared.problem("Title is required");
        }
        String code = coupon(body);
        if (code == null) {
            return Prepared.problem("Coupon code is required");
        }
        String type = choice(body, "type");
        if (type == null) {
            return Prepared.problem("Discount type is not recognised");
        }
        BigDecimal value = money(body);
        if (value == null) {
            return Prepared.problem(moneyProblem(body));
        }
        String scope = scope(body, "all");
        if (scope == null) {
            return Prepared.problem("Scope is not recognised");
        }
        String target = "all".equals(scope) ? null : text(body, "target");
        String targetProblem = targetProblem(scope, target, null, null, products);
        if (targetProblem != null) {
            return Prepared.problem(targetProblem);
        }
        return new Prepared(
                new Draft(title, code, type, value, scope, "product".equals(scope) ? target : null, true), null);
    }

    public static Prepared prepareUpdate(JsonNode body, Draft current, Products products) {
        if (body == null || !body.isObject()) {
            return new Prepared(current, null);
        }
        String title = current.title();
        if (present(body, "title")) {
            title = requiredText(body, "title");
            if (title == null) {
                return Prepared.problem("Title is required");
            }
        }
        String code = current.code();
        if (present(body, "code")) {
            code = coupon(body);
            if (code == null) {
                return Prepared.problem("Coupon code is required");
            }
        }
        String type = current.type();
        if (present(body, "type")) {
            type = choice(body, "type");
            if (type == null) {
                return Prepared.problem("Discount type is not recognised");
            }
        }
        BigDecimal value = current.value();
        if (present(body, "value")) {
            value = money(body);
            if (value == null) {
                return Prepared.problem(moneyProblem(body));
            }
        }
        String scope = current.scope();
        if (present(body, "scope")) {
            scope = scope(body, null);
            if (scope == null) {
                return Prepared.problem("Scope is not recognised");
            }
        }
        String target = "all".equals(scope) ? null : resultingTarget(body, current);
        String targetProblem = targetProblem(scope, target, current, body, products);
        if (targetProblem != null) {
            return Prepared.problem(targetProblem);
        }
        Boolean active = flag(body, "active");
        if (present(body, "active") && active == null) {
            return Prepared.problem("Status is not recognised");
        }
        return new Prepared(
                new Draft(title, code, type, value, scope, target, active == null ? current.active() : active), null);
    }

    private static String targetProblem(String scope, String target, Draft current, JsonNode body, Products products) {
        if (!"product".equals(scope)) {
            return null;
        }
        if (target == null || target.isEmpty()) {
            return "Product is required";
        }
        boolean unchanged = current != null
                && "product".equals(current.scope())
                && target.equals(current.target())
                && body != null
                && !present(body, "target");
        if (!unchanged && !products.contains(target)) {
            return "Product was not found";
        }
        return null;
    }

    private static String resultingTarget(JsonNode body, Draft current) {
        if (present(body, "target")) {
            return text(body, "target");
        }
        return current.target() == null ? "" : current.target();
    }

    private static String requiredText(JsonNode body, String field) {
        if (!present(body, field)) {
            return null;
        }
        String value = text(body, field);
        return value.isEmpty() ? null : value;
    }

    private static String coupon(JsonNode body) {
        String value = requiredText(body, "code");
        return value == null ? null : value.toUpperCase(Locale.ROOT);
    }

    private static String choice(JsonNode body, String field) {
        if (!present(body, field)) {
            return null;
        }
        String value = text(body, field);
        if ("pct".equals(value) || "flat".equals(value)) {
            return value;
        }
        return null;
    }

    private static String scope(JsonNode body, String fallback) {
        if (!present(body, "scope")) {
            return fallback;
        }
        String value = text(body, "scope");
        if ("all".equals(value) || "product".equals(value)) {
            return value;
        }
        return null;
    }

    private static BigDecimal money(JsonNode body) {
        if (!present(body, "value") || moneyProblem(body) != null) {
            return null;
        }
        return decimal(body.get("value")).setScale(2, RoundingMode.UNNECESSARY);
    }

    private static String moneyProblem(JsonNode body) {
        if (!present(body, "value")) {
            return "Discount is invalid";
        }
        BigDecimal value = decimal(body.get("value"));
        if (value == null) {
            return "Discount is invalid";
        }
        if (value.stripTrailingZeros().scale() > 2) {
            return "Discount is invalid";
        }
        if (value.compareTo(BigDecimal.ZERO) <= 0) {
            return "Discount must be greater than zero";
        }
        if (value.precision() - value.scale() > 10) {
            return "Discount is invalid";
        }
        return null;
    }

    private static BigDecimal decimal(JsonNode node) {
        try {
            if (node.isNumber()) {
                return node.decimalValue();
            }
            String text = node.asText().trim();
            if (text.isEmpty()) {
                return null;
            }
            return new BigDecimal(text);
        } catch (NumberFormatException | ArithmeticException exception) {
            return null;
        }
    }

    private static Boolean flag(JsonNode body, String field) {
        if (!present(body, field) || !body.get(field).isBoolean()) {
            return null;
        }
        return body.get(field).booleanValue();
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
}
