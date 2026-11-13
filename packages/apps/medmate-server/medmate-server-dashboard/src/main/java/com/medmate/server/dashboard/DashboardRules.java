package com.medmate.server.dashboard;

import com.medmate.server.reports.ReportBooks;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class DashboardRules {

    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);
    private static final DateTimeFormatter WEEKDAY = DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH);
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH);
    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("MMM", Locale.ENGLISH);

    private DashboardRules() {}

    public record Span(LocalDate from, LocalDate to, String label) {}

    public record Parsed(String range, LocalDate from, LocalDate to, List<Span> buckets, String problem) {}

    public record Today(
            String netSales,
            int bills,
            String averageBill,
            int units,
            String cash,
            String credit,
            List<String> spark,
            String returns,
            int returnCount) {}

    public record Month(String netSales, String purchases, String expenses) {}

    public record Dues(int bills, String outstanding) {}

    public record Attention(String name, int onHand, int reorder) {}

    public record Expiring(String name, String batchNo, String expiry, int qty, int months, boolean expired) {}

    public record Stock(
            int low,
            int expiring,
            int out,
            String cost,
            String retail,
            List<Attention> attention,
            List<Expiring> expiringSoon) {}

    public record RecentBill(String number, String patient, String payMode, String payable) {}

    public record Bucket(
            String label, String cash, String credit, int cashBills, int creditBills, String sales, String purchases) {}

    public record Profit(String taxable, String cogs, String gross) {}

    public record ExpenseBar(String category, String amount) {}

    public record Collected(String cash, String upi, String card) {}

    public record Seller(String name, int qty, String revenue) {}

    public record Window(
            List<Bucket> buckets,
            Profit profit,
            List<ExpenseBar> expenses,
            Collected collected,
            List<Seller> topSellers,
            String returns,
            String margin) {}

    public record Snapshot(
            String range,
            String from,
            String to,
            Today today,
            Month month,
            Dues dues,
            Stock stock,
            List<RecentBill> recent,
            Window window) {}

    public static Parsed parse(String raw, LocalDate today) {
        String value = raw == null || raw.isBlank() ? "7d" : raw.trim();
        return switch (value) {
            case "7d" -> days(value, today.minusDays(6), today, WEEKDAY);
            case "30d" -> days(value, today.minusDays(29), today, DAY);
            case "12m" -> months(today);
            default -> new Parsed(value, null, null, List.of(), "The date range is not valid.");
        };
    }

    public static Snapshot build(ReportBooks books, Parsed range, LocalDate today) {
        List<SaleMove> moves = saleMoves(books);
        List<PurchaseMove> purchases = purchaseMoves(books);
        LocalDate monthFrom = today.withDayOfMonth(1);
        LocalDate monthTo = today.withDayOfMonth(today.lengthOfMonth());
        return new Snapshot(
                range.range,
                range.from.toString(),
                range.to.toString(),
                today(moves, books, today),
                new Month(
                        txt(sum(moves, monthFrom, monthTo)),
                        txt(purchaseTotal(purchases, monthFrom, monthTo)),
                        txt(expenseTotal(books, monthFrom, monthTo))),
                dues(books),
                stock(books, today),
                recent(books),
                window(moves, purchases, books, range));
    }

    private static Parsed days(String range, LocalDate from, LocalDate to, DateTimeFormatter label) {
        List<Span> buckets = new ArrayList<>();
        for (LocalDate day = from; !day.isAfter(to); day = day.plusDays(1)) {
            buckets.add(new Span(day, day, day.format(label)));
        }
        return new Parsed(range, from, to, List.copyOf(buckets), null);
    }

    private static Parsed months(LocalDate today) {
        YearMonth end = YearMonth.from(today);
        YearMonth start = end.minusMonths(11);
        List<Span> buckets = new ArrayList<>();
        for (int index = 0; index < 12; index++) {
            YearMonth month = start.plusMonths(index);
            buckets.add(new Span(
                    month.atDay(1), month.atEndOfMonth(), month.atDay(1).format(MONTH)));
        }
        return new Parsed("12m", start.atDay(1), end.atEndOfMonth(), List.copyOf(buckets), null);
    }

    private static Today today(List<SaleMove> moves, ReportBooks books, LocalDate today) {
        BigDecimal net = sum(moves, today, today);
        BigDecimal cash = sumMode(moves, today, today, false);
        int bills = billCount(books, today, today);
        List<String> spark = new ArrayList<>();
        for (int index = 6; index >= 0; index--) {
            LocalDate day = today.minusDays(index);
            spark.add(txt(sum(moves, day, day)));
        }
        BigDecimal average = bills == 0 ? ZERO : money(net.divide(BigDecimal.valueOf(bills), 2, RoundingMode.HALF_UP));
        ReturnTotal returned = returns(books, today, today);
        return new Today(
                txt(net),
                bills,
                txt(average),
                units(moves, today, today),
                txt(cash),
                txt(sumMode(moves, today, today, true)),
                List.copyOf(spark),
                txt(returned.amount),
                returned.count);
    }

    private static Window window(List<SaleMove> moves, List<PurchaseMove> purchases, ReportBooks books, Parsed range) {
        List<Bucket> buckets = new ArrayList<>();
        for (Span span : range.buckets) {
            BigDecimal cash = sumMode(moves, span.from, span.to, false);
            BigDecimal credit = sumMode(moves, span.from, span.to, true);
            buckets.add(new Bucket(
                    span.label,
                    txt(cash),
                    txt(credit),
                    billCount(books, span.from, span.to, false),
                    billCount(books, span.from, span.to, true),
                    txt(money(cash.add(credit))),
                    txt(purchaseTotal(purchases, span.from, span.to))));
        }
        BigDecimal taxable = ZERO;
        BigDecimal cogs = ZERO;
        for (SaleMove move : moves) {
            if (!inRange(move.day, range.from, range.to)) {
                continue;
            }
            taxable = money(taxable.add(taxableOf(move.inclusive, move.gst)));
            cogs = money(cogs.add(move.cogs));
        }
        BigDecimal gross = money(taxable.subtract(cogs));
        BigDecimal margin = taxable.signum() == 0
                ? ZERO
                : money(gross.multiply(new BigDecimal("100")).divide(taxable, 2, RoundingMode.HALF_UP));
        return new Window(
                List.copyOf(buckets),
                new Profit(txt(taxable), txt(cogs), txt(gross)),
                expenses(books, range.from, range.to),
                collected(moves, books, range.from, range.to),
                sellers(moves, range.from, range.to),
                txt(returns(books, range.from, range.to).amount),
                txt(margin));
    }

    private static Collected collected(List<SaleMove> moves, ReportBooks books, LocalDate from, LocalDate to) {
        BigDecimal[] repaid = new BigDecimal[] {ZERO, ZERO, ZERO};
        for (ReportBooks.Repayment repayment : books.repayments()) {
            if (!inRange(repayment.on(), from, to)) {
                continue;
            }
            int index =
                    switch (repayment.mode()) {
                        case "cash" -> 0;
                        case "upi" -> 1;
                        case "card" -> 2;
                        default -> -1;
                    };
            if (index >= 0) {
                repaid[index] = money(repaid[index].add(repayment.amount()));
            }
        }
        return new Collected(
                txt(money(sumMode(moves, from, to, false).add(repaid[0]))), txt(repaid[1]), txt(repaid[2]));
    }

    private static List<ExpenseBar> expenses(ReportBooks books, LocalDate from, LocalDate to) {
        Map<String, BigDecimal> groups = new LinkedHashMap<>();
        for (ReportBooks.Expense expense : books.expenses()) {
            if (inRange(expense.spentOn(), from, to)) {
                groups.merge(expense.category(), expense.amount(), (left, right) -> money(left.add(right)));
            }
        }
        List<Map.Entry<String, BigDecimal>> entries = new ArrayList<>(groups.entrySet());
        entries.sort(Comparator.<Map.Entry<String, BigDecimal>, BigDecimal>comparing(Map.Entry::getValue)
                .reversed()
                .thenComparing(Map.Entry::getKey));
        List<ExpenseBar> rows = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : entries) {
            rows.add(new ExpenseBar(entry.getKey(), txt(entry.getValue())));
        }
        return List.copyOf(rows);
    }

    private static List<Seller> sellers(List<SaleMove> moves, LocalDate from, LocalDate to) {
        Map<String, SellerAcc> groups = new LinkedHashMap<>();
        for (SaleMove move : moves) {
            if (!inRange(move.day, from, to) || move.productId.isBlank()) {
                continue;
            }
            SellerAcc acc = groups.computeIfAbsent(move.productId, ignored -> new SellerAcc(move.item));
            acc.qty += move.qty;
            acc.revenue = money(acc.revenue.add(move.inclusive));
        }
        List<SellerAcc> ranked = new ArrayList<>();
        for (SellerAcc acc : groups.values()) {
            if (acc.revenue.signum() > 0) {
                ranked.add(acc);
            }
        }
        ranked.sort(
                Comparator.comparing((SellerAcc acc) -> acc.revenue).reversed().thenComparing(acc -> acc.name));
        List<Seller> rows = new ArrayList<>();
        for (SellerAcc acc : ranked) {
            if (rows.size() == 5) {
                break;
            }
            rows.add(new Seller(acc.name, acc.qty, txt(acc.revenue)));
        }
        return List.copyOf(rows);
    }

    private static Dues dues(ReportBooks books) {
        int bills = 0;
        BigDecimal outstanding = ZERO;
        for (OpenBill bill : openBills(books)) {
            bills++;
            outstanding = money(outstanding.add(bill.left));
        }
        return new Dues(bills, txt(outstanding));
    }

    private static Stock stock(ReportBooks books, LocalDate today) {
        YearMonth month = YearMonth.from(today);
        List<ReportBooks.Product> products = new ArrayList<>(books.products());
        products.sort(Comparator.comparing(ReportBooks.Product::name, Comparator.nullsLast(String::compareTo)));
        List<Attention> attention = new ArrayList<>();
        int low = 0;
        for (ReportBooks.Product product : products) {
            int onHand = units(product);
            if (onHand > product.reorder()) {
                continue;
            }
            low++;
            if (attention.size() < 5) {
                attention.add(new Attention(product.name(), onHand, product.reorder()));
            }
        }
        List<Held> held = new ArrayList<>();
        for (ReportBooks.Product product : books.products()) {
            for (ReportBooks.Batch batch : product.batches()) {
                if (batch.qty() <= 0) {
                    continue;
                }
                int months = months(batch.expiry(), month);
                if (months <= 4) {
                    String expiry = batch.expiry() == null || batch.expiry().isBlank() ? "—" : batch.expiry();
                    held.add(new Held(product.name(), batch.batchNo(), expiry, batch.qty(), months, months < 0));
                }
            }
        }
        held.sort(Comparator.comparingInt((Held row) -> row.months)
                .thenComparing(row -> row.name)
                .thenComparing(row -> row.batchNo));
        List<Expiring> soon = new ArrayList<>();
        for (Held row : held) {
            if (soon.size() == 5) {
                break;
            }
            soon.add(new Expiring(row.name, row.batchNo, row.expiry, row.qty, row.months, row.expired));
        }
        int out = 0;
        BigDecimal cost = ZERO;
        BigDecimal retail = ZERO;
        for (ReportBooks.Product product : books.products()) {
            if (units(product) == 0) {
                out++;
            }
            for (ReportBooks.Batch batch : product.batches()) {
                if (batch.qty() <= 0) {
                    continue;
                }
                BigDecimal qty = BigDecimal.valueOf(batch.qty());
                cost = money(cost.add(money(nz(batch.rate()).multiply(qty))));
                retail = money(retail.add(money(nz(batch.mrp()).multiply(qty))));
            }
        }
        return new Stock(low, held.size(), out, txt(cost), txt(retail), List.copyOf(attention), List.copyOf(soon));
    }

    private static BigDecimal expenseTotal(ReportBooks books, LocalDate from, LocalDate to) {
        BigDecimal total = ZERO;
        for (ReportBooks.Expense expense : books.expenses()) {
            if (inRange(expense.spentOn(), from, to)) {
                total = money(total.add(nz(expense.amount())));
            }
        }
        return total;
    }

    private static ReturnTotal returns(ReportBooks books, LocalDate from, LocalDate to) {
        BigDecimal amount = ZERO;
        int count = 0;
        for (ReportBooks.SaleReturn returned : books.saleReturns()) {
            if (!inRange(returned.on(), from, to)) {
                continue;
            }
            count++;
            amount = money(amount.add(nz(returned.amount())));
        }
        return new ReturnTotal(amount, count);
    }

    private static List<RecentBill> recent(ReportBooks books) {
        List<ReportBooks.Bill> bills = new ArrayList<>(books.bills());
        bills.sort(Comparator.comparing(ReportBooks.Bill::soldAt)
                .reversed()
                .thenComparing(Comparator.comparing(ReportBooks.Bill::number).reversed()));
        List<RecentBill> rows = new ArrayList<>();
        for (ReportBooks.Bill bill : bills) {
            if (rows.size() == 6) {
                break;
            }
            rows.add(new RecentBill(bill.number(), bill.patientName(), bill.payMode(), txt(bill.payable())));
        }
        return List.copyOf(rows);
    }

    private static BigDecimal sum(List<SaleMove> moves, LocalDate from, LocalDate to) {
        BigDecimal total = ZERO;
        for (SaleMove move : moves) {
            if (inRange(move.day, from, to)) {
                total = money(total.add(move.inclusive));
            }
        }
        return total;
    }

    private static BigDecimal sumMode(List<SaleMove> moves, LocalDate from, LocalDate to, boolean credit) {
        BigDecimal total = ZERO;
        for (SaleMove move : moves) {
            if (!inRange(move.day, from, to)) {
                continue;
            }
            boolean moveCredit = "credit".equals(move.payMode);
            if (moveCredit == credit) {
                total = money(total.add(move.inclusive));
            }
        }
        return total;
    }

    private static int units(List<SaleMove> moves, LocalDate from, LocalDate to) {
        int total = 0;
        for (SaleMove move : moves) {
            if (inRange(move.day, from, to)) {
                total += move.qty;
            }
        }
        return total;
    }

    private static int billCount(ReportBooks books, LocalDate from, LocalDate to) {
        int total = 0;
        for (ReportBooks.Bill bill : books.bills()) {
            if (inRange(bill.soldOn(), from, to)) {
                total++;
            }
        }
        return total;
    }

    private static int billCount(ReportBooks books, LocalDate from, LocalDate to, boolean credit) {
        int total = 0;
        for (ReportBooks.Bill bill : books.bills()) {
            if (inRange(bill.soldOn(), from, to) && "credit".equals(bill.payMode()) == credit) {
                total++;
            }
        }
        return total;
    }

    private static BigDecimal purchaseTotal(List<PurchaseMove> moves, LocalDate from, LocalDate to) {
        BigDecimal total = ZERO;
        for (PurchaseMove move : moves) {
            if (inRange(move.day, from, to)) {
                total = money(total.add(move.total));
            }
        }
        return total;
    }

    private static List<SaleMove> saleMoves(ReportBooks books) {
        List<SaleMove> moves = new ArrayList<>();
        Map<String, ReportBooks.Bill> bills = new LinkedHashMap<>();
        for (ReportBooks.Bill bill : books.bills()) {
            bills.put(bill.number(), bill);
        }
        for (ReportBooks.Bill bill : books.bills()) {
            Map<Integer, BigDecimal> payable = linePayables(bill);
            for (ReportBooks.BillLine line : bill.lines()) {
                moves.add(new SaleMove(
                        bill.soldOn(),
                        bill.payMode(),
                        line.productId(),
                        line.name(),
                        line.qty(),
                        payable.getOrDefault(line.position(), ZERO),
                        line.gst(),
                        money(nz(line.batchRate()).multiply(BigDecimal.valueOf(line.qty())))));
            }
        }
        for (ReportBooks.SaleReturn returned : books.saleReturns()) {
            ReportBooks.Bill bill = bills.get(returned.billNumber());
            String mode = bill == null ? "cash" : bill.payMode();
            if (returned.lines().isEmpty()) {
                moves.add(new SaleMove(
                        returned.on(), mode, "", "", 0, returned.amount().negate(), 0, ZERO));
                continue;
            }
            Map<Integer, ReportBooks.BillLine> lines = new LinkedHashMap<>();
            if (bill != null) {
                for (ReportBooks.BillLine line : bill.lines()) {
                    lines.put(line.position(), line);
                }
            }
            for (ReportBooks.SaleReturnLine line : returned.lines()) {
                ReportBooks.BillLine sold = lines.get(line.billPosition());
                BigDecimal rate = sold == null ? ZERO : nz(sold.batchRate());
                moves.add(new SaleMove(
                        returned.on(),
                        mode,
                        sold == null ? "" : sold.productId(),
                        sold == null ? "" : sold.name(),
                        -line.qty(),
                        line.amount().negate(),
                        sold == null ? 0 : sold.gst(),
                        money(rate.multiply(BigDecimal.valueOf(line.qty()))).negate()));
            }
        }
        return moves;
    }

    private static List<PurchaseMove> purchaseMoves(ReportBooks books) {
        List<PurchaseMove> moves = new ArrayList<>();
        Map<String, ReportBooks.Purchase> purchases = new LinkedHashMap<>();
        for (ReportBooks.Purchase purchase : books.purchases()) {
            purchases.put(purchase.code(), purchase);
            for (ReportBooks.PurchaseLine line : purchase.lines()) {
                moves.add(purchaseMove(purchase.on(), line.qty(), line.rate(), line.gst()));
            }
        }
        for (ReportBooks.PurchaseReturn returned : books.purchaseReturns()) {
            ReportBooks.Purchase purchase = purchases.get(returned.purchaseCode());
            Map<Integer, ReportBooks.PurchaseLine> lines = new LinkedHashMap<>();
            if (purchase != null) {
                for (ReportBooks.PurchaseLine line : purchase.lines()) {
                    lines.put(line.position(), line);
                }
            }
            for (ReportBooks.PurchaseReturnLine line : returned.lines()) {
                ReportBooks.PurchaseLine source = lines.get(line.position());
                if (source == null) {
                    continue;
                }
                PurchaseMove move = purchaseMove(returned.on(), line.qty(), source.rate(), source.gst());
                moves.add(new PurchaseMove(move.day, move.total.negate()));
            }
        }
        return moves;
    }

    private static PurchaseMove purchaseMove(LocalDate day, int qty, BigDecimal rate, int gst) {
        BigDecimal taxable = money(nz(rate).multiply(BigDecimal.valueOf(qty)));
        BigDecimal tax = gst <= 0
                ? ZERO
                : money(taxable.multiply(BigDecimal.valueOf(gst))
                        .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP));
        return new PurchaseMove(day, money(taxable.add(tax)));
    }

    private static List<OpenBill> openBills(ReportBooks books) {
        Map<String, List<ReportBooks.Bill>> credit = new LinkedHashMap<>();
        for (ReportBooks.Bill bill : books.bills()) {
            if ("credit".equals(bill.payMode())) {
                credit.computeIfAbsent(bill.phone(), ignored -> new ArrayList<>())
                        .add(bill);
            }
        }
        Map<String, BigDecimal> refunds = new LinkedHashMap<>();
        for (ReportBooks.SaleReturn returned : books.saleReturns()) {
            BigDecimal amount = returned.lines().isEmpty()
                    ? returned.amount()
                    : returned.lines().stream()
                            .map(ReportBooks.SaleReturnLine::amount)
                            .reduce(ZERO, (left, right) -> money(left.add(right)));
            refunds.merge(returned.billNumber(), amount, (left, right) -> money(left.add(right)));
        }
        Map<String, BigDecimal> repaid = new LinkedHashMap<>();
        for (ReportBooks.Repayment repayment : books.repayments()) {
            repaid.merge(repayment.phone(), repayment.amount(), (left, right) -> money(left.add(right)));
        }
        List<OpenBill> open = new ArrayList<>();
        for (List<ReportBooks.Bill> bills : credit.values()) {
            List<ReportBooks.Bill> ordered = new ArrayList<>(bills);
            ordered.sort(Comparator.comparing(ReportBooks.Bill::soldAt).thenComparing(ReportBooks.Bill::number));
            BigDecimal pool = repaid.getOrDefault(ordered.get(0).phone(), ZERO);
            for (ReportBooks.Bill bill : ordered) {
                BigDecimal net = money(bill.payable().subtract(refunds.getOrDefault(bill.number(), ZERO)))
                        .max(ZERO);
                BigDecimal left = money(net.subtract(pool)).max(ZERO);
                pool = money(pool.subtract(net)).max(ZERO);
                if (left.signum() > 0) {
                    open.add(new OpenBill(left));
                }
            }
        }
        return open;
    }

    private static Map<Integer, BigDecimal> linePayables(ReportBooks.Bill bill) {
        List<ReportBooks.BillLine> lines = new ArrayList<>(bill.lines());
        lines.sort(Comparator.comparingInt(ReportBooks.BillLine::position));
        List<BigDecimal> nets = new ArrayList<>();
        for (ReportBooks.BillLine line : lines) {
            nets.add(money(nz(line.unitPrice()).multiply(BigDecimal.valueOf(line.qty()))));
        }
        List<BigDecimal> shares = extraShares(nets, nz(bill.extra()));
        Map<Integer, BigDecimal> payable = new LinkedHashMap<>();
        for (int index = 0; index < lines.size(); index++) {
            payable.put(lines.get(index).position(), money(nets.get(index).subtract(shares.get(index))));
        }
        return payable;
    }

    private static List<BigDecimal> extraShares(List<BigDecimal> lineNets, BigDecimal extra) {
        List<BigDecimal> shares = new ArrayList<>();
        List<Integer> positive = new ArrayList<>();
        BigDecimal billNet = ZERO;
        for (int index = 0; index < lineNets.size(); index++) {
            shares.add(ZERO);
            BigDecimal net = money(lineNets.get(index));
            if (net.signum() > 0) {
                positive.add(index);
                billNet = money(billNet.add(net));
            }
        }
        if (positive.isEmpty() || extra.signum() == 0) {
            return shares;
        }
        BigDecimal given = ZERO;
        for (int index = 0; index < positive.size() - 1; index++) {
            int line = positive.get(index);
            BigDecimal share = extra.multiply(lineNets.get(line)).divide(billNet, 2, RoundingMode.HALF_UP);
            shares.set(line, share);
            given = money(given.add(share));
        }
        shares.set(positive.get(positive.size() - 1), money(extra.subtract(given)));
        return shares;
    }

    private static int units(ReportBooks.Product product) {
        int total = 0;
        for (ReportBooks.Batch batch : product.batches()) {
            total += Math.max(batch.qty(), 0);
        }
        return total;
    }

    private static int months(String expiry, YearMonth today) {
        try {
            YearMonth month = YearMonth.parse(expiry);
            return (month.getYear() - today.getYear()) * 12 + month.getMonthValue() - today.getMonthValue();
        } catch (RuntimeException exception) {
            return Integer.MIN_VALUE;
        }
    }

    private static boolean inRange(LocalDate day, LocalDate from, LocalDate to) {
        return day != null && !day.isBefore(from) && !day.isAfter(to);
    }

    private static BigDecimal taxableOf(BigDecimal inclusive, int gst) {
        if (gst <= 0) {
            return money(inclusive);
        }
        BigDecimal divisor = BigDecimal.ONE.add(BigDecimal.valueOf(gst).movePointLeft(2));
        return money(inclusive.divide(divisor, 2, RoundingMode.HALF_UP));
    }

    private static String txt(BigDecimal value) {
        return money(value).toPlainString();
    }

    private static BigDecimal money(BigDecimal value) {
        if (value == null) {
            return ZERO;
        }
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal nz(BigDecimal value) {
        return value == null ? ZERO : value;
    }

    private record SaleMove(
            LocalDate day,
            String payMode,
            String productId,
            String item,
            int qty,
            BigDecimal inclusive,
            int gst,
            BigDecimal cogs) {}

    private record PurchaseMove(LocalDate day, BigDecimal total) {}

    private record OpenBill(BigDecimal left) {}

    private record ReturnTotal(BigDecimal amount, int count) {}

    private static final class SellerAcc {
        private final String name;
        private int qty;
        private BigDecimal revenue = ZERO;

        private SellerAcc(String name) {
            this.name = name == null || name.isBlank() ? "—" : name;
        }
    }

    private record Held(String name, String batchNo, String expiry, int qty, int months, boolean expired) {}
}
