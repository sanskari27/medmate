package com.medmate.server.billing;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class BillRules {

    public static final String READ = "billing:read";
    public static final String CREATE = "billing:create";

    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private BillRules() {}

    public record RequestLine(String productId, String batchNo, int qty, Adjustment discount) {}

    public record Adjustment(String type, BigDecimal value) {}

    public record Request(
            String patientName,
            String patientPhone,
            String prescribedBy,
            String prescriptionNumber,
            Adjustment discount,
            List<RequestLine> lines,
            String payMode) {}

    public record Prepared(Request request, String problem) {

        static Prepared problem(String detail) {
            return new Prepared(null, detail);
        }
    }

    public record StockLine(
            String productId,
            String name,
            String composition,
            Boolean prescriptionRequired,
            String batchNo,
            String expiry,
            int qty,
            BigDecimal mrp,
            Integer gst) {}

    public record Offer(String id, String title, String type, BigDecimal value, String scope, String target) {}

    public record PricedLine(
            String productId,
            String name,
            String composition,
            String batchNo,
            String expiry,
            int qty,
            BigDecimal mrp,
            BigDecimal unitPrice,
            int gst,
            String offerId,
            String offerTitle,
            BigDecimal discount) {}

    public record Priced(
            List<PricedLine> lines,
            BigDecimal subtotal,
            BigDecimal discount,
            BigDecimal payable,
            String prescribedBy,
            String prescriptionNumber,
            String extraType,
            BigDecimal extraValue,
            BigDecimal extraAmount,
            String problem) {

        static Priced problem(String detail) {
            return new Priced(List.of(), null, null, null, null, null, null, null, null, detail);
        }
    }

    public static String number(String prefix, int counter) {
        String head = prefix == null ? "" : prefix;
        return head + String.format(Locale.ROOT, "%04d", counter);
    }

    public static Prepared prepare(JsonNode body) {
        if (body == null || !body.isObject()) {
            return Prepared.problem("Patient name is required");
        }
        String name = text(body, "patientName");
        if (name.isEmpty()) {
            return Prepared.problem("Patient name is required");
        }
        String phone = text(body, "patientPhone");
        if (!phone.matches("[0-9]{10}")) {
            return Prepared.problem("Phone is not valid");
        }
        String payMode = text(body, "payMode");
        if (!"cash".equals(payMode) && !"credit".equals(payMode)) {
            return Prepared.problem("Payment type is not available");
        }
        if ("credit".equals(payMode) && ("Walk-in".equals(name) || "Kiosk (self-order)".equals(name))) {
            return Prepared.problem("Credit needs a customer name");
        }
        JsonNode lines = body.get("lines");
        if (lines == null || !lines.isArray() || lines.isEmpty()) {
            return Prepared.problem("A line is required");
        }
        List<RequestLine> parsed = new ArrayList<>();
        for (JsonNode line : lines) {
            if (line == null || !line.isObject()) {
                return Prepared.problem("Batch is required");
            }
            String batchNo = text(line, "batchNo");
            if (batchNo.isEmpty()) {
                return Prepared.problem("Batch is required");
            }
            String productId = text(line, "productId");
            if (productId.isEmpty()) {
                return Prepared.problem("Batch was not found");
            }
            JsonNode qty = line.get("qty");
            if (qty == null || !qty.isIntegralNumber() || qty.intValue() < 1) {
                return Prepared.problem("Quantity is not valid");
            }
            Adjustment lineDiscount = adjustment(line.get("discount"));
            if (lineDiscount == null) {
                return Prepared.problem("Discount is not valid");
            }
            parsed.add(new RequestLine(productId, batchNo, qty.intValue(), lineDiscount));
        }
        Adjustment discount = adjustment(body.get("discount"));
        if (discount == null) {
            return Prepared.problem("Discount is not valid");
        }
        return new Prepared(
                new Request(
                        name,
                        phone,
                        text(body, "prescribedBy"),
                        text(body, "prescriptionNumber"),
                        discount,
                        parsed,
                        payMode),
                null);
    }

    public static Priced price(Request request, List<StockLine> stock, List<Offer> offers, YearMonth month) {
        Map<String, RequestLine> merged = new LinkedHashMap<>();
        for (RequestLine line : request.lines()) {
            String key = line.productId() + "\n" + line.batchNo();
            RequestLine current = merged.get(key);
            int qty = line.qty() + (current == null ? 0 : current.qty());
            Adjustment discount = current == null ? line.discount() : current.discount();
            merged.put(key, new RequestLine(line.productId(), line.batchNo(), qty, discount));
        }
        List<PricedLine> lines = new ArrayList<>();
        boolean prescription = false;
        BigDecimal subtotal = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal discount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal payable = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        for (RequestLine line : merged.values()) {
            StockLine match = find(stock, line.productId(), line.batchNo());
            if (match == null) {
                return Priced.problem("Batch was not found");
            }
            if (match.prescriptionRequired() == null) {
                return Priced.problem("Prescription status is unknown");
            }
            if (match.gst() == null) {
                return Priced.problem("GST rate is unknown");
            }
            if (expired(match.expiry(), month)) {
                return Priced.problem("Batch is expired");
            }
            if (line.qty() > match.qty()) {
                return Priced.problem("Not enough stock");
            }
            if (match.prescriptionRequired()) {
                prescription = true;
            }
            Offer winner = winner(offers, line.productId(), match.mrp());
            BigDecimal unitOff = winner == null ? money(BigDecimal.ZERO) : unitSaving(winner, match.mrp());
            BigDecimal afterOffer = money(match.mrp().subtract(unitOff));
            BigDecimal extraUnit = adjust(line.discount(), afterOffer);
            BigDecimal unitPrice = money(afterOffer.subtract(extraUnit));
            BigDecimal lineOff = money(unitOff.add(extraUnit).multiply(BigDecimal.valueOf(line.qty())));
            BigDecimal lineMrp = money(match.mrp().multiply(BigDecimal.valueOf(line.qty())));
            BigDecimal lineNet = money(unitPrice.multiply(BigDecimal.valueOf(line.qty())));
            lines.add(new PricedLine(
                    match.productId(),
                    match.name(),
                    match.composition(),
                    match.batchNo(),
                    match.expiry(),
                    line.qty(),
                    money(match.mrp()),
                    unitPrice,
                    match.gst(),
                    winner == null ? null : winner.id(),
                    winner == null ? null : winner.title(),
                    lineOff));
            subtotal = subtotal.add(lineMrp);
            discount = discount.add(lineOff);
            payable = payable.add(lineNet);
        }
        String doctor = null;
        String prescriptionNumber = null;
        if (prescription) {
            if (request.prescribedBy().isEmpty()) {
                return Priced.problem("Prescribed by is required");
            }
            if (request.prescriptionNumber().isEmpty()) {
                return Priced.problem("Prescription number is required");
            }
            doctor = request.prescribedBy();
            prescriptionNumber = request.prescriptionNumber();
        }
        BigDecimal extraAmount = adjust(request.discount(), payable);
        payable = money(payable.subtract(extraAmount));
        discount = money(discount.add(extraAmount));
        Adjustment extra = request.discount();
        return new Priced(
                lines,
                subtotal,
                discount,
                payable,
                doctor,
                prescriptionNumber,
                extra.type(),
                extra.value(),
                extraAmount,
                null);
    }

    private static Adjustment adjustment(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return new Adjustment("none", BigDecimal.ZERO);
        }
        if (!node.isObject()) {
            return null;
        }
        String type = text(node, "type");
        if (type.isEmpty()) {
            type = "none";
        }
        if (!"none".equals(type) && !"percent".equals(type) && !"flat".equals(type)) {
            return null;
        }
        JsonNode value = node.get("value");
        BigDecimal amount = BigDecimal.ZERO;
        if (value != null && !value.isNull()) {
            if (!value.isNumber()) {
                return null;
            }
            amount = value.decimalValue();
        }
        if (amount.signum() < 0) {
            return null;
        }
        if ("percent".equals(type) && amount.compareTo(HUNDRED) > 0) {
            return null;
        }
        if ("none".equals(type)) {
            amount = BigDecimal.ZERO;
        }
        return new Adjustment(type, amount);
    }

    private static BigDecimal adjust(Adjustment extra, BigDecimal base) {
        if (extra == null || "none".equals(extra.type()) || extra.value().signum() <= 0) {
            return money(BigDecimal.ZERO);
        }
        if ("percent".equals(extra.type())) {
            return money(base.multiply(extra.value()).divide(HUNDRED, 2, RoundingMode.HALF_UP));
        }
        return money(extra.value().min(base));
    }

    private static StockLine find(List<StockLine> stock, String productId, String batchNo) {
        for (StockLine line : stock) {
            if (line.productId().equals(productId) && line.batchNo().equals(batchNo)) {
                return line;
            }
        }
        return null;
    }

    private static boolean expired(String expiry, YearMonth month) {
        try {
            return YearMonth.parse(expiry).isBefore(month);
        } catch (RuntimeException exception) {
            return true;
        }
    }

    private static Offer winner(List<Offer> offers, String productId, BigDecimal mrp) {
        Offer best = null;
        BigDecimal saving = money(BigDecimal.ZERO);
        for (Offer offer : offers) {
            if (!matches(offer, productId)) {
                continue;
            }
            BigDecimal unit = unitSaving(offer, mrp);
            if (unit.signum() <= 0) {
                continue;
            }
            int compare = unit.compareTo(saving);
            if (compare > 0 || (compare == 0 && preferred(offer, best))) {
                best = offer;
                saving = unit;
            }
        }
        return best;
    }

    private static boolean matches(Offer offer, String productId) {
        if ("product".equals(offer.scope())) {
            return productId.equals(offer.target());
        }
        return "all".equals(offer.scope());
    }

    private static boolean preferred(Offer offer, Offer current) {
        if (current == null) {
            return true;
        }
        boolean product = "product".equals(offer.scope());
        boolean currentProduct = "product".equals(current.scope());
        if (product != currentProduct) {
            return product;
        }
        return offerNumber(offer.id()) > offerNumber(current.id());
    }

    private static int offerNumber(String id) {
        int dash = id == null ? -1 : id.lastIndexOf('-');
        if (dash < 0 || dash == id.length() - 1) {
            return 0;
        }
        try {
            return Integer.parseInt(id.substring(dash + 1));
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private static BigDecimal unitSaving(Offer offer, BigDecimal mrp) {
        if ("pct".equals(offer.type())) {
            return money(mrp.multiply(offer.value()).divide(HUNDRED, 2, RoundingMode.HALF_UP));
        }
        return money(offer.value().min(mrp));
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static String text(JsonNode body, String field) {
        JsonNode node = body.get(field);
        if (node == null || node.isNull()) {
            return "";
        }
        return node.asText().trim();
    }
}
