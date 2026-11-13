package com.medmate.server.expenses;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public final class ExpenseRules {

    public static final String READ = "expenses:read";
    public static final String CREATE = "expenses:create";
    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");
    public static final List<String> CATEGORIES = List.of(
            "Employee Salaries & Advances",
            "Rent Expense",
            "Electricity Bill",
            "Telephone & Internet Expense",
            "Printing and Stationery",
            "Repair & Maintenance",
            "Transportation & Travel",
            "Raw Material",
            "Marketing & Promotion",
            "Bank Charges",
            "Miscellaneous");

    private static final String INVALID = "Expense is not valid";
    private static final Set<String> MODES = Set.of("cash", "upi", "card", "cod");
    private static final Set<Integer> RATES = Set.of(0, 5, 12, 18, 28);
    private static final BigDecimal MAX_AMOUNT = new BigDecimal("999999999999.99");

    private ExpenseRules() {}

    public record Draft(
            LocalDate spentOn,
            String party,
            String category,
            String paymentMode,
            BigDecimal amount,
            int gst,
            String note) {}

    public record Parsed(Draft draft, String problem) {}

    public record Range(LocalDate from, LocalDate to) {}

    public record SavedCategory(String category, int firstSeq) {}

    public record Summary(int count, BigDecimal total, BigDecimal gst) {}

    public static String number(int seq) {
        return "EXP-" + (1000 + seq);
    }

    public static Parsed parse(JsonNode body, LocalDate today) {
        if (body == null || !body.isObject() || today == null) {
            return new Parsed(null, INVALID);
        }
        LocalDate spentOn = date(body.get("spentOn"));
        String party = text(body.get("party"));
        String category = text(body.get("category"));
        String mode = raw(body.get("paymentMode"));
        BigDecimal amount = amount(body.get("amount"));
        Integer gst = rate(body.get("gst"));
        String note = note(body.get("note"));
        if (spentOn == null
                || spentOn.isAfter(today)
                || party.isEmpty()
                || party.length() > 120
                || category.isEmpty()
                || category.length() > 80
                || !MODES.contains(mode)
                || amount == null
                || gst == null
                || note == null && body.has("note") && !body.get("note").isNull() && !blank(body.get("note"))) {
            return new Parsed(null, INVALID);
        }
        if (note != null && note.length() > 500) {
            return new Parsed(null, INVALID);
        }
        return new Parsed(new Draft(spentOn, party, category, mode, amount, gst, note), null);
    }

    public static Range range(String fromRaw, String toRaw, LocalDate today) {
        boolean fromBlank = fromRaw == null || fromRaw.isBlank();
        boolean toBlank = toRaw == null || toRaw.isBlank();
        if (fromBlank && toBlank) {
            return new Range(today.minusDays(364), today);
        }
        if (fromBlank || toBlank) {
            return null;
        }
        LocalDate from = date(fromRaw.trim());
        LocalDate to = date(toRaw.trim());
        if (from == null || to == null || from.isAfter(to)) {
            return null;
        }
        return new Range(from, to);
    }

    public static String categoryFilter(String category) {
        if (category == null || category.isBlank() || category.trim().equals("all")) {
            return "";
        }
        return category;
    }

    public static BigDecimal tax(BigDecimal amount, int gst) {
        BigDecimal scaled = money(amount);
        if (gst == 0) {
            return money(BigDecimal.ZERO);
        }
        BigDecimal divisor = BigDecimal.ONE.add(BigDecimal.valueOf(gst).movePointLeft(2));
        BigDecimal taxable = scaled.divide(divisor, 2, RoundingMode.HALF_UP);
        return money(scaled.subtract(taxable));
    }

    public static Summary summarize(List<BigDecimal> amounts, List<Integer> rates) {
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal gst = BigDecimal.ZERO;
        for (int index = 0; index < amounts.size(); index++) {
            BigDecimal amount = money(amounts.get(index));
            total = total.add(amount);
            gst = gst.add(tax(amount, rates.get(index)));
        }
        return new Summary(amounts.size(), money(total), money(gst));
    }

    public static List<String> categories(List<SavedCategory> saved) {
        LinkedHashSet<String> names = new LinkedHashSet<>(CATEGORIES);
        List<SavedCategory> ordered = new ArrayList<>(saved);
        ordered.sort((left, right) -> Integer.compare(left.firstSeq(), right.firstSeq()));
        for (SavedCategory row : ordered) {
            if (row.category() != null && !row.category().isBlank()) {
                names.add(row.category());
            }
        }
        return List.copyOf(names);
    }

    public static String moneyText(BigDecimal amount) {
        return money(amount).toPlainString();
    }

    private static BigDecimal money(BigDecimal amount) {
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private static LocalDate date(JsonNode node) {
        if (node == null || !node.isTextual()) {
            return null;
        }
        return date(node.asText().trim());
    }

    private static LocalDate date(String value) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeException exception) {
            return null;
        }
    }

    private static String text(JsonNode node) {
        if (node == null || node.isNull() || !node.isTextual()) {
            return "";
        }
        return node.asText().trim();
    }

    private static String raw(JsonNode node) {
        if (node == null || !node.isTextual()) {
            return "";
        }
        return node.asText();
    }

    private static BigDecimal amount(JsonNode node) {
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
        if (value.signum() <= 0 || value.stripTrailingZeros().scale() > 2 || value.compareTo(MAX_AMOUNT) > 0) {
            return null;
        }
        return money(value);
    }

    private static Integer rate(JsonNode node) {
        if (node == null || !node.isIntegralNumber()) {
            return null;
        }
        int value = node.intValue();
        return RATES.contains(value) ? value : null;
    }

    private static String note(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (!node.isTextual()) {
            return null;
        }
        String trimmed = node.asText().trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static boolean blank(JsonNode node) {
        return node.isTextual() && node.asText().isBlank();
    }
}
