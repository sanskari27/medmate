package com.medmate.server.prep;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class PrepRules {

    public static final int MAX_ROWS = 2000;
    public static final String NAME_REQUIRED = "Name is required";
    public static final String NAME_LONG = "Name is too long";
    public static final String NAME_TAKEN = "List name already exists";
    public static final String LINES_INVALID = "Lines are not valid";
    public static final String TOO_MANY = "A list can hold 2000 rows";
    public static final String DUPLICATE = "This product and batch is already on the list";
    public static final String ADD_ROW = "Add at least one row";
    public static final String NOT_FOUND = "Product was not found";
    public static final String AMBIGUOUS = "Product id is ambiguous";
    public static final String CATALOG_DOWN = "Medicine catalog is unavailable";

    private static final Pattern EXPIRY = Pattern.compile("^\\d{4}-(0[1-9]|1[0-2])$");
    private static final Set<Integer> GST = Set.of(0, 5, 12, 18);
    private static final String PRODUCT = "Product is required";
    private static final String PRODUCT_NAME = "Product name is required";
    private static final String BATCH_INVALID = "Batch number is not valid";
    private static final String BATCH_REQUIRED = "Batch number is required";
    private static final String EXPIRY_INVALID = "Expiry is not valid";
    private static final String QUANTITY = "Quantity must be a whole number";
    private static final String UNIT = "Add at least one unit";
    private static final String RATE = "Rate is not valid";
    private static final String MRP = "MRP is not valid";
    private static final String GST_INVALID = "GST percent is not recognised";

    private PrepRules() {}

    public record Line(
            String productId,
            String productName,
            String batchNo,
            String expiry,
            Integer qty,
            Integer free,
            BigDecimal rate,
            BigDecimal mrp,
            Integer gst) {}

    public record Named(String value, String problem) {}

    public record Lines(List<Line> lines, String problem) {}

    public static Named name(JsonNode body) {
        if (body == null || !body.isObject()) {
            return new Named(null, NAME_REQUIRED);
        }
        JsonNode node = body.get("name");
        if (node == null || node.isNull() || !node.isTextual()) {
            return new Named(null, NAME_REQUIRED);
        }
        String value = node.asText().trim();
        if (value.isEmpty()) {
            return new Named(null, NAME_REQUIRED);
        }
        if (value.length() > 80) {
            return new Named(null, NAME_LONG);
        }
        return new Named(value, null);
    }

    public static String nameKey(String name) {
        return name.toLowerCase(Locale.ROOT);
    }

    public static Lines lines(JsonNode body) {
        if (body == null
                || !body.isObject()
                || !body.has("lines")
                || !body.get("lines").isArray()) {
            return new Lines(null, LINES_INVALID);
        }
        JsonNode rows = body.get("lines");
        if (rows.size() > MAX_ROWS) {
            return new Lines(null, TOO_MANY);
        }
        List<Line> lines = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (int index = 0; index < rows.size(); index++) {
            String problem = line(rows.get(index), index + 1, lines, seen);
            if (problem != null) {
                return new Lines(null, problem);
            }
        }
        return new Lines(List.copyOf(lines), null);
    }

    public static String exportProblem(List<Line> lines) {
        if (lines == null || lines.isEmpty()) {
            return ADD_ROW;
        }
        for (int index = 0; index < lines.size(); index++) {
            String problem = complete(lines.get(index), index + 1);
            if (problem != null) {
                return problem;
            }
        }
        return null;
    }

    public static String csv(List<Line> lines) {
        StringBuilder out = new StringBuilder("product_id,product_name,batch_no,expiry,qty,free,rate,mrp,gst\n");
        for (Line line : lines) {
            out.append(cell(line.productId()))
                    .append(',')
                    .append(cell(line.productName()))
                    .append(',')
                    .append(cell(line.batchNo()))
                    .append(',')
                    .append(cell(line.expiry()))
                    .append(',')
                    .append(line.qty())
                    .append(',')
                    .append(line.free())
                    .append(',')
                    .append(line.rate().setScale(2, RoundingMode.HALF_UP).toPlainString())
                    .append(',')
                    .append(line.mrp().setScale(2, RoundingMode.HALF_UP).toPlainString())
                    .append(',')
                    .append(line.gst())
                    .append('\n');
        }
        return out.toString();
    }

    public static String fileName(String name) {
        String slug = name.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        slug = slug.replaceAll("^-+", "").replaceAll("-+$", "");
        if (slug.length() > 60) {
            slug = slug.substring(0, 60).replaceAll("-+$", "");
        }
        if (slug.isEmpty()) {
            return "inventory.csv";
        }
        return slug + ".csv";
    }

    public static String row(int position, String detail) {
        return "Row " + position + ": " + detail;
    }

    private static String line(JsonNode node, int position, List<Line> lines, Set<String> seen) {
        if (node == null || !node.isObject()) {
            return row(position, PRODUCT);
        }
        Field<String> productId = requiredText(node.get("productId"), 80, PRODUCT);
        if (productId.problem() != null) {
            return row(position, productId.problem());
        }
        Field<String> productName = requiredText(node.get("productName"), 300, PRODUCT_NAME);
        if (productName.problem() != null) {
            return row(position, productName.problem());
        }
        Field<String> batch = batch(node.get("batchNo"));
        if (batch.problem() != null) {
            return row(position, batch.problem());
        }
        Field<String> expiry = expiry(node.get("expiry"));
        if (expiry.problem() != null) {
            return row(position, expiry.problem());
        }
        Field<Integer> qty = whole(node.get("qty"));
        if (qty.problem() != null) {
            return row(position, qty.problem());
        }
        Field<Integer> free = whole(node.get("free"));
        if (free.problem() != null) {
            return row(position, free.problem());
        }
        Field<BigDecimal> rate = money(node.get("rate"), RATE);
        if (rate.problem() != null) {
            return row(position, rate.problem());
        }
        Field<BigDecimal> mrp = money(node.get("mrp"), MRP);
        if (mrp.problem() != null) {
            return row(position, mrp.problem());
        }
        Field<Integer> gst = gst(node.get("gst"));
        if (gst.problem() != null) {
            return row(position, gst.problem());
        }
        if (!seen.add(productId.value() + "\n" + batch.value())) {
            return DUPLICATE;
        }
        lines.add(new Line(
                productId.value(),
                productName.value(),
                batch.value(),
                expiry.value(),
                qty.value(),
                free.value(),
                rate.value(),
                mrp.value(),
                gst.value()));
        return null;
    }

    private static String complete(Line line, int position) {
        if (line.batchNo() == null || line.batchNo().isEmpty()) {
            return row(position, BATCH_REQUIRED);
        }
        if (line.expiry() == null) {
            return row(position, EXPIRY_INVALID);
        }
        if (line.qty() == null || line.free() == null) {
            return row(position, QUANTITY);
        }
        if (line.qty() == 0 && line.free() == 0) {
            return row(position, UNIT);
        }
        if (line.rate() == null) {
            return row(position, RATE);
        }
        if (line.mrp() == null) {
            return row(position, MRP);
        }
        if (line.gst() == null) {
            return row(position, GST_INVALID);
        }
        return null;
    }

    private static Field<String> requiredText(JsonNode node, int max, String problem) {
        if (node == null || node.isNull() || !node.isTextual()) {
            return Field.bad(problem);
        }
        String value = node.asText().trim();
        if (value.isEmpty() || value.length() > max) {
            return Field.bad(problem);
        }
        return Field.ok(value);
    }

    private static Field<String> batch(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return Field.ok("");
        }
        if (!node.isTextual()) {
            return Field.bad(BATCH_INVALID);
        }
        String value = node.asText().trim();
        if (value.length() > 40) {
            return Field.bad(BATCH_INVALID);
        }
        return Field.ok(value);
    }

    private static Field<String> expiry(JsonNode node) {
        if (blank(node)) {
            return Field.ok(null);
        }
        if (!node.isTextual()) {
            return Field.bad(EXPIRY_INVALID);
        }
        String value = node.asText().trim();
        if (!EXPIRY.matcher(value).matches()) {
            return Field.bad(EXPIRY_INVALID);
        }
        try {
            LocalDate.parse(value + "-01");
        } catch (DateTimeException exception) {
            return Field.bad(EXPIRY_INVALID);
        }
        return Field.ok(value);
    }

    private static Field<Integer> whole(JsonNode node) {
        if (blank(node)) {
            return Field.ok(null);
        }
        if (!node.isNumber() && !node.isTextual()) {
            return Field.bad(QUANTITY);
        }
        try {
            BigDecimal value = new BigDecimal(node.asText().trim());
            if (value.signum() < 0
                    || value.stripTrailingZeros().scale() > 0
                    || value.compareTo(BigDecimal.valueOf(Integer.MAX_VALUE)) > 0) {
                return Field.bad(QUANTITY);
            }
            return Field.ok(value.intValueExact());
        } catch (NumberFormatException | ArithmeticException exception) {
            return Field.bad(QUANTITY);
        }
    }

    private static Field<BigDecimal> money(JsonNode node, String problem) {
        if (blank(node)) {
            return Field.ok(null);
        }
        if (!node.isNumber() && !node.isTextual()) {
            return Field.bad(problem);
        }
        try {
            BigDecimal value = new BigDecimal(node.asText().trim());
            if (value.signum() < 0 || value.stripTrailingZeros().scale() > 2) {
                return Field.bad(problem);
            }
            return Field.ok(value.setScale(2, RoundingMode.HALF_UP));
        } catch (NumberFormatException exception) {
            return Field.bad(problem);
        }
    }

    private static Field<Integer> gst(JsonNode node) {
        if (blank(node)) {
            return Field.ok(null);
        }
        Field<Integer> parsed = whole(node);
        if (parsed.problem() != null || parsed.value() == null || !GST.contains(parsed.value())) {
            return Field.bad(GST_INVALID);
        }
        return parsed;
    }

    private static boolean blank(JsonNode node) {
        return node == null
                || node.isNull()
                || node.isMissingNode()
                || (node.isTextual() && node.asText().trim().isEmpty());
    }

    private static String cell(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    private record Field<T>(T value, String problem) {
        static <T> Field<T> ok(T value) {
            return new Field<>(value, null);
        }

        static <T> Field<T> bad(String problem) {
            return new Field<>(null, problem);
        }
    }
}
