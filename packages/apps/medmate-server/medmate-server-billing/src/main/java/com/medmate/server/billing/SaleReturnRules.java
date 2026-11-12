package com.medmate.server.billing;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class SaleReturnRules {

    public static final String READ = "sales:read";
    public static final String RETURN = "sales:return";

    private SaleReturnRules() {}

    public record SoldLine(
            int position, String productId, String batchNo, int qty, int returnedQty, BigDecimal unitPrice) {}

    public record RequestLine(int position, int qty) {}

    public record Prepared(List<RequestLine> lines, String problem) {

        static Prepared problem(String detail) {
            return new Prepared(List.of(), detail);
        }
    }

    public record QuotedLine(int position, String productId, String batchNo, int qty, BigDecimal amount) {}

    public record Quote(List<QuotedLine> lines, BigDecimal amount, String problem) {

        static Quote problem(String detail) {
            return new Quote(List.of(), null, detail);
        }
    }

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

    public static Prepared prepare(JsonNode body) {
        if (body == null || !body.isObject()) {
            return Prepared.problem("A line is required");
        }
        JsonNode lines = body.get("lines");
        if (lines == null || !lines.isArray() || lines.isEmpty()) {
            return Prepared.problem("A line is required");
        }
        List<RequestLine> parsed = new ArrayList<>();
        List<Integer> seen = new ArrayList<>();
        int units = 0;
        for (JsonNode line : lines) {
            if (line == null
                    || !line.isObject()
                    || !line.has("position")
                    || !line.get("position").isIntegralNumber()) {
                return Prepared.problem("Return is more than the quantity sold");
            }
            JsonNode qty = line.get("qty");
            if (qty == null || !qty.isIntegralNumber()) {
                return Prepared.problem("Quantity is not valid");
            }
            int count = qty.intValue();
            if (count < 0) {
                return Prepared.problem("Quantity is not valid");
            }
            if (count == 0) {
                continue;
            }
            int position = line.get("position").intValue();
            if (seen.contains(position)) {
                return Prepared.problem("Return is more than the quantity sold");
            }
            seen.add(position);
            parsed.add(new RequestLine(position, count));
            units += count;
        }
        if (units < 1) {
            return Prepared.problem("A line is required");
        }
        return new Prepared(parsed, null);
    }

    public static Quote quote(List<SoldLine> sold, BigDecimal extraAmount, List<RequestLine> requested) {
        List<SoldLine> ordered = new ArrayList<>(sold);
        ordered.sort((left, right) -> Integer.compare(left.position(), right.position()));
        List<BigDecimal> nets = new ArrayList<>();
        Map<Integer, SoldLine> byPosition = new LinkedHashMap<>();
        for (SoldLine line : ordered) {
            nets.add(money(line.unitPrice().multiply(BigDecimal.valueOf(line.qty()))));
            byPosition.put(line.position(), line);
        }
        List<BigDecimal> shares = extraShares(nets, extraAmount == null ? money(BigDecimal.ZERO) : extraAmount);
        Map<Integer, BigDecimal> payable = new LinkedHashMap<>();
        for (int index = 0; index < ordered.size(); index++) {
            payable.put(ordered.get(index).position(), money(nets.get(index).subtract(shares.get(index))));
        }
        List<QuotedLine> quoted = new ArrayList<>();
        BigDecimal total = money(BigDecimal.ZERO);
        for (RequestLine request : requested) {
            SoldLine line = byPosition.get(request.position());
            int remaining = line == null ? 0 : line.qty() - line.returnedQty();
            if (line == null || request.qty() > remaining) {
                return Quote.problem("Return is more than the quantity sold");
            }
            BigDecimal amount = refund(payable.get(line.position()), line.qty(), line.returnedQty(), request.qty());
            quoted.add(new QuotedLine(line.position(), line.productId(), line.batchNo(), request.qty(), amount));
            total = money(total.add(amount));
        }
        return new Quote(quoted, total, null);
    }

    public static List<BigDecimal> extraShares(List<BigDecimal> lineNets, BigDecimal extra) {
        List<BigDecimal> shares = new ArrayList<>();
        List<Integer> positive = new ArrayList<>();
        BigDecimal billNet = money(BigDecimal.ZERO);
        for (int index = 0; index < lineNets.size(); index++) {
            shares.add(money(BigDecimal.ZERO));
            BigDecimal net = money(lineNets.get(index));
            if (net.signum() > 0) {
                positive.add(index);
                billNet = money(billNet.add(net));
            }
        }
        if (positive.isEmpty() || extra.signum() == 0) {
            return shares;
        }
        BigDecimal given = money(BigDecimal.ZERO);
        for (int index = 0; index < positive.size() - 1; index++) {
            int line = positive.get(index);
            BigDecimal share = extra.multiply(lineNets.get(line)).divide(billNet, 2, RoundingMode.HALF_UP);
            shares.set(line, share);
            given = money(given.add(share));
        }
        int last = positive.get(positive.size() - 1);
        shares.set(last, money(extra.subtract(given)));
        return shares;
    }

    public static BigDecimal refund(BigDecimal linePayable, int qty, int alreadyReturned, int take) {
        int paise = linePayable
                .movePointRight(2)
                .setScale(0, RoundingMode.UNNECESSARY)
                .intValueExact();
        int base = Math.floorDiv(paise, qty);
        int remainder = Math.floorMod(paise, qty);
        int sum = 0;
        for (int index = alreadyReturned; index < alreadyReturned + take; index++) {
            sum += base + (index < remainder ? 1 : 0);
        }
        return BigDecimal.valueOf(sum, 2);
    }

    private static String formatCode(int number) {
        if (number < 1000) {
            return String.format(Locale.ROOT, "RET-%03d", number);
        }
        return "RET-" + number;
    }

    private static Integer codeNumber(String code) {
        if (code == null || !code.startsWith("RET-")) {
            return null;
        }
        String tail = code.substring(4);
        if (tail.isEmpty()) {
            return null;
        }
        for (int index = 0; index < tail.length(); index++) {
            if (!Character.isDigit(tail.charAt(index))) {
                return null;
            }
        }
        return Integer.parseInt(tail);
    }

    private static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
