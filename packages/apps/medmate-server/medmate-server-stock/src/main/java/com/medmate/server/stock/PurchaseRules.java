package com.medmate.server.stock;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

public final class PurchaseRules {

    public static final String READ = "purchases:read";
    public static final String CREATE = "purchases:create";
    public static final String RETURN = "purchases:return";
    public static final int MAX_LINES = 200;

    private static final List<Integer> GST = List.of(0, 5, 12, 18);
    private static final Pattern EXPIRY = Pattern.compile("^\\d{4}-(0[1-9]|1[0-2])$");

    private PurchaseRules() {}

    public record Line(
            String productId,
            String batchNo,
            String expiry,
            int qty,
            int freeQty,
            BigDecimal rate,
            BigDecimal mrp,
            int gst) {}

    public record Prepared(
            String distributorId,
            String invoiceNo,
            LocalDate invoiceDate,
            List<Line> lines,
            int ledgerAmount,
            String problem) {

        static Prepared problem(String detail) {
            return new Prepared(null, null, null, List.of(), 0, detail);
        }
    }

    public record Source(
            int position, String productId, String batchNo, int qty, int freeQty, BigDecimal rate, int gst) {}

    public record Taken(int qty, int freeQty) {}

    public record ReturnLine(int position, int qty, int freeQty) {}

    public record ReturnPrepared(List<ReturnLine> lines, int ledgerAmount, String problem) {

        static ReturnPrepared problem(String detail) {
            return new ReturnPrepared(List.of(), 0, detail);
        }
    }

    public record IdList(List<String> ids, String problem) {}

    public static BigDecimal taxable(BigDecimal rate, int qty) {
        return rate.multiply(BigDecimal.valueOf(qty)).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal gstAmount(BigDecimal taxable, int percent) {
        return taxable.multiply(BigDecimal.valueOf(percent)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    public static int ledger(List<Line> lines) {
        BigDecimal total = BigDecimal.ZERO;
        for (Line line : lines) {
            BigDecimal net = taxable(line.rate(), line.qty());
            total = total.add(net).add(gstAmount(net, line.gst()));
        }
        return rupees(total);
    }

    public static int rupees(BigDecimal total) {
        return total.setScale(0, RoundingMode.HALF_UP).intValueExact();
    }

    public static String batchKey(String productId, String batchNo) {
        return productId + "\n" + batchNo;
    }

    public static Prepared prepare(JsonNode body, LocalDate today) {
        if (body == null || !body.isObject()) {
            return Prepared.problem("Distributor is required");
        }
        String distributor = required(body, "distributorId");
        if (distributor == null) {
            return Prepared.problem("Distributor is required");
        }
        String invoice = required(body, "invoiceNo");
        if (invoice == null || invoice.length() > 40) {
            return Prepared.problem("Invoice number is required");
        }
        if (!present(body, "invoiceDate")) {
            return Prepared.problem("Invoice date is not valid");
        }
        LocalDate date;
        try {
            date = LocalDate.parse(text(body, "invoiceDate"));
        } catch (DateTimeParseException exception) {
            return Prepared.problem("Invoice date is not valid");
        }
        if (date.isAfter(today)) {
            return Prepared.problem("Invoice date is in the future");
        }
        if (!present(body, "lines")
                || !body.get("lines").isArray()
                || body.get("lines").isEmpty()) {
            return Prepared.problem("Add at least one line");
        }
        if (body.get("lines").size() > MAX_LINES) {
            return Prepared.problem("A purchase can have at most 200 lines");
        }
        List<Line> parsed = new ArrayList<>();
        for (JsonNode node : body.get("lines")) {
            Line line = line(node);
            if (line == null) {
                return Prepared.problem(lineProblem(node));
            }
            parsed.add(line);
        }
        try {
            List<Line> merged = merge(parsed);
            return new Prepared(distributor, invoice, date, merged, ledger(merged), null);
        } catch (ArithmeticException exception) {
            return Prepared.problem("Bill total is too large");
        } catch (IllegalStateException exception) {
            return Prepared.problem(exception.getMessage());
        }
    }

    public static ReturnPrepared prepareReturn(
            List<Source> sources, Map<Integer, Taken> taken, Map<String, Integer> onHand, JsonNode body) {
        if (body == null
                || !body.isObject()
                || !present(body, "lines")
                || !body.get("lines").isArray()) {
            return ReturnPrepared.problem("Return at least one unit");
        }
        Map<Integer, Source> byPosition = new LinkedHashMap<>();
        for (Source source : sources) {
            byPosition.put(source.position(), source);
        }
        List<ReturnLine> lines = new ArrayList<>();
        Map<Integer, Boolean> seen = new LinkedHashMap<>();
        Map<String, Integer> requested = new LinkedHashMap<>();
        for (JsonNode node : body.get("lines")) {
            if (node == null || !node.isObject() || !whole(node, "position")) {
                return ReturnPrepared.problem("Return line was not found");
            }
            int position = node.get("position").intValue();
            if (seen.put(position, true) != null) {
                return ReturnPrepared.problem("Return line is repeated");
            }
            if (!whole(node, "qty") || !whole(node, "freeQty")) {
                return ReturnPrepared.problem("Quantity must be a whole number");
            }
            int qty = node.get("qty").intValue();
            int free = node.get("freeQty").intValue();
            if (qty < 0 || free < 0) {
                return ReturnPrepared.problem("Quantity must be a whole number");
            }
            if (qty == 0 && free == 0) {
                continue;
            }
            Source source = byPosition.get(position);
            if (source == null) {
                return ReturnPrepared.problem("Return line was not found");
            }
            Taken prior = taken.getOrDefault(position, new Taken(0, 0));
            if (qty > source.qty() - prior.qty() || free > source.freeQty() - prior.freeQty()) {
                return ReturnPrepared.problem("Return is more than the quantity received");
            }
            String key = batchKey(source.productId(), source.batchNo());
            requested.put(key, requested.getOrDefault(key, 0) + qty + free);
            lines.add(new ReturnLine(position, qty, free));
        }
        if (lines.isEmpty()) {
            return ReturnPrepared.problem("Return at least one unit");
        }
        for (Map.Entry<String, Integer> entry : requested.entrySet()) {
            int available = onHand.getOrDefault(entry.getKey(), 0);
            if (entry.getValue() > available) {
                return ReturnPrepared.problem("Return is more than the batch");
            }
        }
        List<Line> priced = new ArrayList<>();
        for (ReturnLine line : lines) {
            Source source = byPosition.get(line.position());
            priced.add(new Line(
                    source.productId(),
                    source.batchNo(),
                    "2000-01",
                    line.qty(),
                    line.freeQty(),
                    source.rate(),
                    BigDecimal.ZERO,
                    source.gst()));
        }
        try {
            return new ReturnPrepared(lines, ledger(priced), null);
        } catch (ArithmeticException exception) {
            return ReturnPrepared.problem("Bill total is too large");
        }
    }

    public static IdList ids(JsonNode body) {
        if (body == null
                || !body.isObject()
                || !present(body, "ids")
                || !body.get("ids").isArray()) {
            return new IdList(List.of(), "Send 1 to 200 product ids");
        }
        List<String> ids = new ArrayList<>();
        for (JsonNode node : body.get("ids")) {
            String id = node == null || node.isNull() ? "" : node.asText().trim();
            if (id.isEmpty() || ids.contains(id)) {
                continue;
            }
            if (id.length() > 80) {
                return new IdList(List.of(), "Send 1 to 200 product ids");
            }
            ids.add(id);
        }
        if (ids.isEmpty() || ids.size() > MAX_LINES) {
            return new IdList(List.of(), "Send 1 to 200 product ids");
        }
        return new IdList(ids, null);
    }

    public static Integer reorder(JsonNode body) {
        if (body == null || !body.isObject() || !whole(body, "reorderLevel")) {
            return null;
        }
        int value = body.get("reorderLevel").intValue();
        if (value < 0) {
            return null;
        }
        return value;
    }

    public static Integer limit(String raw) {
        if (raw == null || raw.isBlank()) {
            return 20;
        }
        try {
            int value = Integer.parseInt(raw.trim());
            if (value < 1) {
                return null;
            }
            return Math.min(value, 50);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static List<Line> merge(List<Line> lines) {
        Map<String, Line> merged = new LinkedHashMap<>();
        for (Line line : lines) {
            String key = batchKey(line.productId(), line.batchNo());
            Line current = merged.get(key);
            if (current == null) {
                merged.put(key, line);
                continue;
            }
            if (!current.expiry().equals(line.expiry())
                    || current.rate().compareTo(line.rate()) != 0
                    || current.mrp().compareTo(line.mrp()) != 0
                    || current.gst() != line.gst()) {
                throw new IllegalStateException("Batch details do not match");
            }
            int qty;
            int free;
            try {
                qty = Math.addExact(current.qty(), line.qty());
                free = Math.addExact(current.freeQty(), line.freeQty());
            } catch (ArithmeticException exception) {
                throw new IllegalStateException("Quantity must be a whole number");
            }
            merged.put(
                    key,
                    new Line(
                            line.productId(),
                            line.batchNo(),
                            line.expiry(),
                            qty,
                            free,
                            line.rate(),
                            line.mrp(),
                            line.gst()));
        }
        return List.copyOf(merged.values());
    }

    private static Line line(JsonNode node) {
        if (lineProblem(node) != null) {
            return null;
        }
        return new Line(
                text(node, "productId"),
                text(node, "batchNo"),
                text(node, "expiry"),
                node.get("qty").intValue(),
                node.get("freeQty").intValue(),
                money(node.get("rate")),
                money(node.get("mrp")),
                node.get("gst").intValue());
    }

    private static String lineProblem(JsonNode node) {
        if (node == null || !node.isObject()) {
            return "Product is required";
        }
        String product = required(node, "productId");
        if (product == null || product.length() > 80) {
            return "Product is required";
        }
        String batch = required(node, "batchNo");
        if (batch == null || batch.length() > 40) {
            return "Batch number is required";
        }
        if (!EXPIRY.matcher(text(node, "expiry")).matches()) {
            return "Expiry is not valid";
        }
        try {
            LocalDate.parse(text(node, "expiry") + "-01");
        } catch (DateTimeException exception) {
            return "Expiry is not valid";
        }
        if (!whole(node, "qty") || !whole(node, "freeQty")) {
            return "Quantity must be a whole number";
        }
        int qty = node.get("qty").intValue();
        int free = node.get("freeQty").intValue();
        if (qty < 0 || free < 0) {
            return "Quantity must be a whole number";
        }
        if (qty == 0 && free == 0) {
            return "Add at least one unit";
        }
        if (money(node.get("rate")) == null) {
            return "Rate is not valid";
        }
        if (money(node.get("mrp")) == null) {
            return "MRP is not valid";
        }
        if (!whole(node, "gst") || !GST.contains(node.get("gst").intValue())) {
            return "GST percent is not recognised";
        }
        return null;
    }

    private static BigDecimal money(JsonNode node) {
        if (node == null || node.isNull() || !node.isNumber()) {
            return null;
        }
        try {
            BigDecimal value = new BigDecimal(node.asText());
            if (value.signum() < 0 || value.stripTrailingZeros().scale() > 2) {
                return null;
            }
            return value.setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private static boolean whole(JsonNode body, String field) {
        return present(body, field)
                && body.get(field).isIntegralNumber()
                && body.get(field).canConvertToInt();
    }

    private static String required(JsonNode body, String field) {
        if (!present(body, field) || text(body, field).isEmpty()) {
            return null;
        }
        return text(body, field);
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
