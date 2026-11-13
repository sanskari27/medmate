package com.medmate.server.reports;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

public final class ReportRules {

    public static final String READ = "reports:read";
    public static final String EXPORT = "reports:export";
    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2);
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter SHORT_DAY = DateTimeFormatter.ofPattern("dd MMM yy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.ENGLISH).withZone(ZONE);

    private static final Map<String, Meta> CATALOG = catalog();

    private ReportRules() {}

    public record Column(String key, String label, boolean money, boolean num) {}

    public record Result(
            String id,
            String name,
            String description,
            String from,
            String to,
            String label,
            List<Column> columns,
            List<List<Object>> rows,
            List<Object> totals,
            String note) {}

    public record Window(LocalDate from, LocalDate to, String problem) {}

    public static boolean known(String id) {
        return CATALOG.containsKey(id);
    }

    public static Window window(String fromText, String toText, LocalDate today) {
        boolean missingFrom = fromText == null || fromText.isBlank();
        boolean missingTo = toText == null || toText.isBlank();
        if (missingFrom && missingTo) {
            return new Window(today.withDayOfMonth(1), today.withDayOfMonth(today.lengthOfMonth()), null);
        }
        if (missingFrom || missingTo) {
            return new Window(null, null, "The date range is not valid.");
        }
        LocalDate from;
        LocalDate to;
        try {
            from = LocalDate.parse(fromText);
            to = LocalDate.parse(toText);
        } catch (RuntimeException exception) {
            return new Window(null, null, "The date range is not valid.");
        }
        if (from.isAfter(to)) {
            return new Window(from, to, "The date range is not valid.");
        }
        return new Window(from, to, null);
    }

    public static Result run(String id, ReportBooks books, LocalDate from, LocalDate to, LocalDate today) {
        Meta meta = CATALOG.get(id);
        if (meta == null) {
            return null;
        }
        String label = meta.snapshot
                ? "As of today"
                : from.equals(to) ? from.format(DAY) : from.format(DAY) + " – " + to.format(DAY);
        Built built =
                switch (id) {
                    case "gstr1" -> gstr(true, books, from, to);
                    case "gstr2" -> gstr(false, books, from, to);
                    case "gstr3b" -> gstr3b(books, from, to);
                    case "pnl" -> pnl(books, from, to);
                    case "sales-summary" -> salesSummary(books, from, to);
                    case "audit-trail" -> audit(books, from, to);
                    case "bill-wise-profit" -> billProfit(books, from, to);
                    case "cash-bank" -> cashBank(books, from, to);
                    case "daybook" -> daybook(books, from, to);
                    case "expense-category" -> expenseCategory(books, from, to);
                    case "expense-transaction" -> expenseTransactions(books, from, to);
                    case "purchase-summary" -> purchaseSummary(books, from, to);
                    case "item-by-party" -> itemParty(books, from, to, false);
                    case "party-by-item" -> itemParty(books, from, to, true);
                    case "item-sales-purchase" -> itemSales(books, from, to);
                    case "low-stock" -> lowStock(books);
                    case "rate-list" -> rateList(books);
                    case "stock-detail" -> stockDetail(books, today);
                    case "stock-summary" -> stockSummary(books, today);
                    case "receivable-ageing" -> ageing(books, today);
                    case "party-ledger" -> partyLedger(books, from, to, today);
                    case "party-outstanding" -> partyOutstanding(books, today);
                    case "sales-category-wise" -> category(books, from, to);
                    default -> new Built(
                            List.of(col("x", "—", false, false)), List.of(), null, "This report is not available.");
                };
        return new Result(
                id,
                meta.name,
                meta.description,
                from.toString(),
                to.toString(),
                label,
                built.columns,
                built.rows,
                built.totals,
                built.note);
    }

    public static String csv(Result result) {
        StringBuilder out = new StringBuilder();
        List<String> header = new ArrayList<>();
        for (Column column : result.columns) {
            header.add(csvCell(column.label));
        }
        out.append(String.join(",", header)).append('\n');
        for (List<Object> row : result.rows) {
            out.append(csvRow(row)).append('\n');
        }
        if (result.totals != null) {
            out.append(csvRow(result.totals)).append('\n');
        }
        return out.toString();
    }

    private static Built gstr(boolean sales, ReportBooks books, LocalDate from, LocalDate to) {
        Map<Integer, Slab> slabs = new TreeMap<>();
        if (sales) {
            for (SaleMove move : saleMoves(books)) {
                if (inRange(move.day, from, to)) {
                    slabs.computeIfAbsent(move.gst, ignored -> new Slab()).add(move.qty, move.inclusive, move.gst);
                }
            }
        } else {
            for (PurchaseMove move : purchaseMoves(books)) {
                if (inRange(move.day, from, to)) {
                    slabs.computeIfAbsent(move.gst, ignored -> new Slab())
                            .add(move.qty, move.taxable, move.tax, move.total);
                }
            }
        }
        List<List<Object>> rows = new ArrayList<>();
        Slab total = new Slab();
        for (Map.Entry<Integer, Slab> entry : slabs.entrySet()) {
            Slab slab = entry.getValue();
            if (slab.qty == 0 && slab.total.signum() == 0) {
                continue;
            }
            rows.add(slabRow(entry.getKey() + "%", slab));
            total.add(slab);
        }
        String empty = sales ? "No outward supplies in this period." : "No inward supplies in this period.";
        return table(
                gstColumns(), rows, rows.isEmpty() ? null : slabRow("TOTAL", total), rows.isEmpty() ? empty : null);
    }

    private static Built gstr3b(ReportBooks books, LocalDate from, LocalDate to) {
        Slab outward = new Slab();
        for (SaleMove move : saleMoves(books)) {
            if (inRange(move.day, from, to)) {
                outward.add(move.qty, move.inclusive, move.gst);
            }
        }
        Slab inward = new Slab();
        for (PurchaseMove move : purchaseMoves(books)) {
            if (inRange(move.day, from, to)) {
                inward.add(move.qty, move.taxable, move.tax, move.total);
            }
        }
        BigDecimal net = money(outward.tax.subtract(inward.tax));
        String totalsLabel = net.signum() >= 0 ? "Net GST payable" : "Net GST credit";
        return table(
                List.of(
                        col("d", "Description", false, false),
                        col("taxable", "Taxable value", true, false),
                        col("tax", "Tax", true, false)),
                List.of(
                        List.of("3.1 Outward taxable supplies", txt(outward.taxable), txt(outward.tax)),
                        List.of("4. Eligible ITC (inward)", txt(inward.taxable), txt(inward.tax))),
                List.of(totalsLabel, "", txt(net.abs())),
                null);
    }

    private static Built pnl(ReportBooks books, LocalDate from, LocalDate to) {
        BigDecimal taxable = ZERO;
        BigDecimal cogs = ZERO;
        for (SaleMove move : saleMoves(books)) {
            if (inRange(move.day, from, to)) {
                taxable = money(taxable.add(taxableOf(move.inclusive, move.gst)));
                cogs = money(cogs.add(move.cogs));
            }
        }
        BigDecimal expenses = ZERO;
        for (ReportBooks.Expense expense : books.expenses()) {
            if (inRange(expense.spentOn(), from, to)) {
                expenses = money(expenses.add(expense.amount()));
            }
        }
        BigDecimal gross = money(taxable.subtract(cogs));
        return table(
                statementColumns(),
                List.of(
                        List.of("Taxable sales", txt(taxable)),
                        List.of("COGS", txt(cogs)),
                        List.of("Gross profit", txt(gross)),
                        List.of("Expenses", txt(expenses)),
                        List.of("Net profit", txt(money(gross.subtract(expenses))))),
                null,
                "COGS uses the sold batch rate.");
    }

    private static Built salesSummary(ReportBooks books, LocalDate from, LocalDate to) {
        BigDecimal cash = ZERO;
        BigDecimal credit = ZERO;
        int units = 0;
        int bills = 0;
        for (SaleMove move : saleMoves(books)) {
            if (!inRange(move.day, from, to)) {
                continue;
            }
            units += move.qty;
            if ("credit".equals(move.payMode)) {
                credit = money(credit.add(move.inclusive));
            } else {
                cash = money(cash.add(move.inclusive));
            }
        }
        for (ReportBooks.Bill bill : books.bills()) {
            if (inRange(bill.soldOn(), from, to)) {
                bills++;
            }
        }
        BigDecimal total = money(cash.add(credit));
        BigDecimal average =
                bills == 0 ? ZERO : money(total.divide(BigDecimal.valueOf(bills), 2, RoundingMode.HALF_UP));
        return table(
                statementColumns(),
                List.of(
                        List.of("Cash sales", txt(cash)),
                        List.of("Credit sales", txt(credit)),
                        List.of("Total sales", txt(total)),
                        List.of("Average bill", txt(average))),
                null,
                bills + " bills · " + units + " units");
    }

    private static Built audit(ReportBooks books, LocalDate from, LocalDate to) {
        List<Event> events = new ArrayList<>();
        Map<String, ReportBooks.Bill> bills = billsByNumber(books);
        Map<String, ReportBooks.Purchase> purchases = purchasesByCode(books);
        for (ReportBooks.Bill bill : books.bills()) {
            if (inRange(bill.soldOn(), from, to)) {
                events.add(new Event(
                        bill.soldAt(),
                        bill.number(),
                        time(bill.soldAt()),
                        bill.number(),
                        "Sale",
                        bill.patientName(),
                        bill.payable(),
                        "credit".equals(bill.payMode()) ? "Credit" : "Cash"));
            }
        }
        for (ReportBooks.SaleReturn returned : books.saleReturns()) {
            if (!inRange(returned.on(), from, to)) {
                continue;
            }
            ReportBooks.Bill bill = bills.get(returned.billNumber());
            events.add(new Event(
                    returned.at(),
                    returned.code(),
                    time(returned.at()),
                    returned.code(),
                    "Sale return",
                    bill == null ? returned.billNumber() : bill.patientName(),
                    returned.amount(),
                    "Return"));
        }
        for (ReportBooks.Purchase purchase : books.purchases()) {
            if (inRange(purchase.on(), from, to)) {
                events.add(new Event(
                        purchase.at(),
                        purchase.code(),
                        time(purchase.at()),
                        purchase.code(),
                        "Purchase",
                        purchase.supplier(),
                        money(BigDecimal.valueOf(purchase.ledger())),
                        "Recorded"));
            }
        }
        for (ReportBooks.PurchaseReturn returned : books.purchaseReturns()) {
            if (!inRange(returned.on(), from, to)) {
                continue;
            }
            ReportBooks.Purchase purchase = purchases.get(returned.purchaseCode());
            events.add(new Event(
                    returned.at(),
                    returned.code(),
                    time(returned.at()),
                    returned.code(),
                    "Purchase return",
                    purchase == null ? returned.purchaseCode() : purchase.supplier(),
                    money(BigDecimal.valueOf(returned.ledger())),
                    "Return"));
        }
        for (ReportBooks.Expense expense : books.expenses()) {
            if (inRange(expense.spentOn(), from, to)) {
                Instant at = expense.spentOn().atStartOfDay(ZONE).toInstant();
                events.add(new Event(
                        at,
                        expense.number(),
                        time(at),
                        expense.number(),
                        "Expense",
                        expense.party(),
                        expense.amount(),
                        modeLabel(expense.mode())));
            }
        }
        Map<String, String> names = namesByPhone(books);
        for (ReportBooks.Repayment repayment : books.repayments()) {
            if (inRange(repayment.on(), from, to)) {
                events.add(new Event(
                        repayment.at(),
                        repayment.code(),
                        time(repayment.at()),
                        repayment.code(),
                        "Repayment",
                        names.getOrDefault(repayment.phone(), repayment.phone()),
                        repayment.amount(),
                        modeLabel(repayment.mode())));
            }
        }
        for (ReportBooks.Payment payment : books.payments()) {
            if (inRange(payment.on(), from, to)) {
                events.add(new Event(
                        payment.at(),
                        payment.code(),
                        time(payment.at()),
                        payment.code(),
                        "Distributor payment",
                        payment.party(),
                        payment.amount(),
                        modeLabel(payment.mode())));
            }
        }
        events.sort(Comparator.comparing(Event::at).reversed().thenComparing(Event::id));
        List<List<Object>> rows = new ArrayList<>();
        for (Event event : events) {
            rows.add(List.of(event.when, event.document, event.type, event.party, txt(event.amount), event.status));
        }
        return table(
                List.of(
                        col("time", "Time", false, false),
                        col("doc", "Document", false, false),
                        col("type", "Type", false, false),
                        col("party", "Party", false, false),
                        col("amt", "Amount", true, false),
                        col("status", "Status", false, false)),
                rows,
                null,
                rows.isEmpty() ? "No documents in this period." : null);
    }

    private static Built billProfit(ReportBooks books, LocalDate from, LocalDate to) {
        List<ReportBooks.Bill> bills = new ArrayList<>();
        for (ReportBooks.Bill bill : books.bills()) {
            if (inRange(bill.soldOn(), from, to)) {
                bills.add(bill);
            }
        }
        bills.sort(Comparator.comparing(ReportBooks.Bill::soldOn).thenComparing(ReportBooks.Bill::number));
        List<List<Object>> rows = new ArrayList<>();
        BigDecimal sale = ZERO;
        BigDecimal cogs = ZERO;
        BigDecimal profit = ZERO;
        for (ReportBooks.Bill bill : bills) {
            Map<Integer, BigDecimal> payable = linePayables(bill);
            BigDecimal leftSale = ZERO;
            BigDecimal leftCogs = ZERO;
            for (ReportBooks.BillLine line : bill.lines()) {
                if (line.qty() <= 0) {
                    continue;
                }
                int leftQty = Math.max(0, line.qty() - line.returnedQty());
                BigDecimal full = payable.getOrDefault(line.position(), ZERO);
                BigDecimal left = leftQty == 0 ? ZERO : refund(full, line.qty(), line.returnedQty(), leftQty);
                leftSale = money(leftSale.add(taxableOf(left, line.gst())));
                leftCogs = money(leftCogs.add(money(nz(line.batchRate()).multiply(BigDecimal.valueOf(leftQty)))));
            }
            BigDecimal lineProfit = money(leftSale.subtract(leftCogs));
            rows.add(List.of(
                    bill.number(),
                    bill.soldOn().format(DAY),
                    bill.patientName(),
                    txt(leftSale),
                    txt(leftCogs),
                    txt(lineProfit),
                    percent(lineProfit, leftSale)));
            sale = money(sale.add(leftSale));
            cogs = money(cogs.add(leftCogs));
            profit = money(profit.add(lineProfit));
        }
        return table(
                List.of(
                        col("inv", "Invoice", false, false),
                        col("date", "Date", false, false),
                        col("party", "Party", false, false),
                        col("rev", "Sale (ex-GST)", true, false),
                        col("cogs", "COGS", true, false),
                        col("profit", "Profit", true, false),
                        col("margin", "Margin", false, true)),
                rows,
                rows.isEmpty() ? null : List.of("TOTAL", "", "", txt(sale), txt(cogs), txt(profit), ""),
                rows.isEmpty() ? "No sales in this period." : null);
    }

    private static Built cashBank(ReportBooks books, LocalDate from, LocalDate to) {
        int cashBills = 0;
        BigDecimal cashSales = ZERO;
        for (ReportBooks.Bill bill : books.bills()) {
            if ("cash".equals(bill.payMode()) && inRange(bill.soldOn(), from, to)) {
                cashBills++;
            }
        }
        for (SaleMove move : saleMoves(books)) {
            if (inRange(move.day, from, to) && !"credit".equals(move.payMode)) {
                cashSales = money(cashSales.add(move.inclusive));
            }
        }
        int[] counts = new int[3];
        BigDecimal[] amounts = new BigDecimal[] {ZERO, ZERO, ZERO};
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
                counts[index]++;
                amounts[index] = money(amounts[index].add(repayment.amount()));
            }
        }
        List<List<Object>> rows = List.of(
                List.of("Cash sales", "Cash", cashBills, txt(cashSales)),
                List.of("Cash repayments", "Cash", counts[0], txt(amounts[0])),
                List.of("UPI", "Bank", counts[1], txt(amounts[1])),
                List.of("Card", "Bank", counts[2], txt(amounts[2])));
        int bills = cashBills + counts[0] + counts[1] + counts[2];
        BigDecimal collected = money(cashSales.add(amounts[0]).add(amounts[1]).add(amounts[2]));
        return table(
                List.of(
                        col("mode", "Payment mode", false, false),
                        col("acct", "Account", false, false),
                        col("bills", "Bills", false, true),
                        col("amt", "Collected", true, false)),
                rows,
                List.of("TOTAL", "", bills, txt(collected)),
                null);
    }

    private static Built daybook(ReportBooks books, LocalDate from, LocalDate to) {
        Map<LocalDate, BigDecimal> sales = new TreeMap<>();
        Map<LocalDate, BigDecimal> purchases = new TreeMap<>();
        for (SaleMove move : saleMoves(books)) {
            if (inRange(move.day, from, to)) {
                sales.merge(move.day, move.inclusive, (left, right) -> money(left.add(right)));
            }
        }
        for (PurchaseMove move : purchaseMoves(books)) {
            if (inRange(move.day, from, to)) {
                purchases.merge(move.day, move.total, (left, right) -> money(left.add(right)));
            }
        }
        List<LocalDate> days = new ArrayList<>();
        days.addAll(sales.keySet());
        for (LocalDate day : purchases.keySet()) {
            if (!sales.containsKey(day)) {
                days.add(day);
            }
        }
        days.sort(Comparator.naturalOrder());
        List<List<Object>> rows = new ArrayList<>();
        BigDecimal sale = ZERO;
        BigDecimal purchase = ZERO;
        for (LocalDate day : days) {
            BigDecimal daySales = sales.getOrDefault(day, ZERO);
            BigDecimal dayPurchases = purchases.getOrDefault(day, ZERO);
            rows.add(List.of(
                    day.format(SHORT_DAY),
                    txt(daySales),
                    txt(dayPurchases),
                    txt(money(daySales.subtract(dayPurchases)))));
            sale = money(sale.add(daySales));
            purchase = money(purchase.add(dayPurchases));
        }
        return table(
                List.of(
                        col("day", "Day", false, false),
                        col("sales", "Net sales", true, false),
                        col("purch", "Purchases", true, false),
                        col("net", "Net cash flow", true, false)),
                rows,
                rows.isEmpty() ? null : List.of("TOTAL", txt(sale), txt(purchase), txt(money(sale.subtract(purchase)))),
                rows.isEmpty() ? "No activity in this period." : null);
    }

    private static Built expenseCategory(ReportBooks books, LocalDate from, LocalDate to) {
        Map<String, ExpenseAcc> groups = new TreeMap<>();
        for (ReportBooks.Expense expense : books.expenses()) {
            if (!inRange(expense.spentOn(), from, to)) {
                continue;
            }
            ExpenseAcc acc = groups.computeIfAbsent(expense.category(), ignored -> new ExpenseAcc());
            acc.count++;
            acc.tax = money(acc.tax.add(gstPart(expense.amount(), expense.gst())));
            acc.amount = money(acc.amount.add(expense.amount()));
        }
        List<Map.Entry<String, ExpenseAcc>> entries = new ArrayList<>(groups.entrySet());
        entries.sort(Comparator.<Map.Entry<String, ExpenseAcc>, BigDecimal>comparing(entry -> entry.getValue().amount)
                .reversed()
                .thenComparing(Map.Entry::getKey));
        List<List<Object>> rows = new ArrayList<>();
        ExpenseAcc total = new ExpenseAcc();
        for (Map.Entry<String, ExpenseAcc> entry : entries) {
            ExpenseAcc acc = entry.getValue();
            BigDecimal taxable = money(acc.amount.subtract(acc.tax));
            rows.add(List.of(entry.getKey(), acc.count, txt(taxable), txt(acc.tax), txt(acc.amount)));
            total.count += acc.count;
            total.tax = money(total.tax.add(acc.tax));
            total.amount = money(total.amount.add(acc.amount));
        }
        return table(
                List.of(
                        col("cat", "Category", false, false),
                        col("count", "Entries", false, true),
                        col("taxable", "Taxable", true, false),
                        col("tax", "GST", true, false),
                        col("amt", "Amount", true, false)),
                rows,
                rows.isEmpty()
                        ? null
                        : List.of(
                                "TOTAL",
                                total.count,
                                txt(money(total.amount.subtract(total.tax))),
                                txt(total.tax),
                                txt(total.amount)),
                rows.isEmpty() ? "No expenses recorded in this period." : null);
    }

    private static Built expenseTransactions(ReportBooks books, LocalDate from, LocalDate to) {
        List<ReportBooks.Expense> expenses = new ArrayList<>();
        for (ReportBooks.Expense expense : books.expenses()) {
            if (inRange(expense.spentOn(), from, to)) {
                expenses.add(expense);
            }
        }
        expenses.sort(Comparator.comparing(ReportBooks.Expense::spentOn)
                .reversed()
                .thenComparing(Comparator.comparing(ReportBooks.Expense::number).reversed()));
        List<List<Object>> rows = new ArrayList<>();
        BigDecimal total = ZERO;
        for (ReportBooks.Expense expense : expenses) {
            rows.add(List.of(
                    expense.number(),
                    expense.spentOn().format(DAY),
                    expense.party(),
                    expense.category(),
                    modeLabel(expense.mode()),
                    txt(expense.amount())));
            total = money(total.add(expense.amount()));
        }
        return table(
                List.of(
                        col("no", "Expense no", false, false),
                        col("date", "Date", false, false),
                        col("party", "Paid to", false, false),
                        col("cat", "Category", false, false),
                        col("pay", "Mode", false, false),
                        col("amt", "Amount", true, false)),
                rows,
                rows.isEmpty() ? null : List.of("TOTAL", "", "", "", "", txt(total)),
                rows.isEmpty() ? "No expenses recorded in this period." : null);
    }

    private static Built purchaseSummary(ReportBooks books, LocalDate from, LocalDate to) {
        List<ReportBooks.Purchase> purchases = new ArrayList<>();
        for (ReportBooks.Purchase purchase : books.purchases()) {
            if (inRange(purchase.on(), from, to)) {
                purchases.add(purchase);
            }
        }
        purchases.sort(Comparator.comparing(ReportBooks.Purchase::on).thenComparing(ReportBooks.Purchase::code));
        List<List<Object>> rows = new ArrayList<>();
        int items = 0;
        BigDecimal taxable = ZERO;
        BigDecimal tax = ZERO;
        BigDecimal total = ZERO;
        for (ReportBooks.Purchase purchase : purchases) {
            Slab slab = new Slab();
            for (ReportBooks.PurchaseLine line : purchase.lines()) {
                BigDecimal lineTaxable = money(nz(line.rate()).multiply(BigDecimal.valueOf(line.qty())));
                BigDecimal lineTax = gstOn(lineTaxable, line.gst());
                slab.add(line.qty(), lineTaxable, lineTax, money(lineTaxable.add(lineTax)));
            }
            rows.add(List.of(
                    purchase.code(),
                    purchase.on().format(DAY),
                    purchase.supplier(),
                    purchase.invoiceNo(),
                    purchase.lines().size(),
                    txt(slab.taxable),
                    txt(slab.tax),
                    txt(slab.total)));
            items += purchase.lines().size();
            taxable = money(taxable.add(slab.taxable));
            tax = money(tax.add(slab.tax));
            total = money(total.add(slab.total));
        }
        return table(
                List.of(
                        col("grn", "GRN", false, false),
                        col("date", "Date", false, false),
                        col("supplier", "Supplier", false, false),
                        col("inv", "Invoice no", false, false),
                        col("items", "Items", false, true),
                        col("taxable", "Taxable", true, false),
                        col("gst", "GST", true, false),
                        col("total", "Total", true, false)),
                rows,
                rows.isEmpty() ? null : List.of("TOTAL", "", "", "", items, txt(taxable), txt(tax), txt(total)),
                rows.isEmpty() ? "No purchases in this period." : null);
    }

    private static Built itemParty(ReportBooks books, LocalDate from, LocalDate to, boolean partyFirst) {
        Map<String, ReportBooks.Product> products = products(books);
        Map<String, ItemAcc> groups = new LinkedHashMap<>();
        for (SaleMove move : saleMoves(books)) {
            if (!inRange(move.day, from, to) || move.productId.isEmpty()) {
                continue;
            }
            String item = itemName(products, move.productId, move.item);
            String key = (partyFirst ? move.phone : move.productId) + "\n" + (partyFirst ? move.productId : move.phone);
            ItemAcc acc = groups.computeIfAbsent(
                    key, ignored -> new ItemAcc(partyFirst ? move.party : item, partyFirst ? item : move.party));
            acc.qty += move.qty;
            acc.value = money(acc.value.add(taxableOf(move.inclusive, move.gst)));
        }
        List<ItemAcc> values = new ArrayList<>();
        for (ItemAcc acc : groups.values()) {
            if (acc.qty != 0 || acc.value.signum() != 0) {
                values.add(acc);
            }
        }
        values.sort(Comparator.comparing((ItemAcc acc) -> acc.value).reversed().thenComparing(acc -> acc.a));
        List<List<Object>> rows = new ArrayList<>();
        int qty = 0;
        BigDecimal value = ZERO;
        for (ItemAcc acc : values) {
            rows.add(List.of(acc.a, acc.b, acc.qty, txt(acc.value)));
            qty += acc.qty;
            value = money(value.add(acc.value));
        }
        return table(
                List.of(
                        col("a", partyFirst ? "Party" : "Item", false, false),
                        col("b", partyFirst ? "Item" : "Party", false, false),
                        col("qty", "Qty", false, true),
                        col("val", "Value (ex-GST)", true, false)),
                rows,
                rows.isEmpty() ? null : List.of("TOTAL", "", qty, txt(value)),
                rows.isEmpty() ? "No sales in this period." : null);
    }

    private static Built itemSales(ReportBooks books, LocalDate from, LocalDate to) {
        Map<String, ReportBooks.Product> products = products(books);
        Map<String, Flow> flows = new LinkedHashMap<>();
        for (SaleMove move : saleMoves(books)) {
            if (!inRange(move.day, from, to) || move.productId.isEmpty()) {
                continue;
            }
            Flow flow = flows.computeIfAbsent(
                    move.productId, ignored -> new Flow(itemName(products, move.productId, move.item)));
            flow.soldQty += move.qty;
            flow.sold = money(flow.sold.add(taxableOf(move.inclusive, move.gst)));
        }
        for (PurchaseMove move : purchaseMoves(books)) {
            if (!inRange(move.day, from, to) || move.productId.isEmpty()) {
                continue;
            }
            Flow flow = flows.computeIfAbsent(
                    move.productId, ignored -> new Flow(itemName(products, move.productId, move.item)));
            flow.purchQty += move.qty;
            flow.purch = money(flow.purch.add(move.taxable));
        }
        List<Map.Entry<String, Flow>> entries = new ArrayList<>(flows.entrySet());
        entries.sort(Comparator.<Map.Entry<String, Flow>, BigDecimal>comparing(entry -> entry.getValue().sold)
                .reversed()
                .thenComparing(entry -> entry.getValue().name));
        List<List<Object>> rows = new ArrayList<>();
        int soldQty = 0;
        int purchQty = 0;
        BigDecimal sold = ZERO;
        BigDecimal purch = ZERO;
        for (Map.Entry<String, Flow> entry : entries) {
            Flow flow = entry.getValue();
            if (flow.soldQty == 0 && flow.purchQty == 0 && flow.sold.signum() == 0 && flow.purch.signum() == 0) {
                continue;
            }
            ReportBooks.Product product = products.get(entry.getKey());
            rows.add(List.of(
                    flow.name,
                    flow.soldQty,
                    txt(flow.sold),
                    flow.purchQty,
                    txt(flow.purch),
                    product == null ? 0 : units(product)));
            soldQty += flow.soldQty;
            purchQty += flow.purchQty;
            sold = money(sold.add(flow.sold));
            purch = money(purch.add(flow.purch));
        }
        return table(
                List.of(
                        col("item", "Item", false, false),
                        col("sq", "Sold qty", false, true),
                        col("sv", "Sold value", true, false),
                        col("pq", "Purch qty", false, true),
                        col("pv", "Purch value", true, false),
                        col("stock", "In stock", false, true)),
                rows,
                rows.isEmpty() ? null : List.of("TOTAL", soldQty, txt(sold), purchQty, txt(purch), ""),
                rows.isEmpty() ? "No item movement in this period." : null);
    }

    private static Built lowStock(ReportBooks books) {
        List<ReportBooks.Product> products = new ArrayList<>(books.products());
        products.sort(Comparator.comparing(ReportBooks.Product::name));
        List<List<Object>> rows = new ArrayList<>();
        for (ReportBooks.Product product : products) {
            int onHand = units(product);
            if (onHand > product.reorder()) {
                continue;
            }
            rows.add(List.of(
                    product.name(),
                    blank(product.type()),
                    onHand,
                    product.reorder(),
                    blank(product.rack()),
                    onHand == 0 ? "Out of stock" : "Low"));
        }
        return table(
                List.of(
                        col("item", "Item", false, false),
                        col("cat", "Category", false, false),
                        col("stock", "In stock", false, true),
                        col("reorder", "Reorder level", false, true),
                        col("rack", "Rack", false, false),
                        col("status", "Status", false, false)),
                rows,
                null,
                rows.isEmpty() ? "No items at or below reorder level." : null);
    }

    private static Built rateList(ReportBooks books) {
        List<ReportBooks.Product> products = new ArrayList<>(books.products());
        products.sort(Comparator.comparing(ReportBooks.Product::name));
        List<List<Object>> rows = new ArrayList<>();
        for (ReportBooks.Product product : products) {
            ReportBooks.Batch batch = earliest(product, true);
            if (batch == null) {
                batch = earliest(product, false);
            }
            BigDecimal mrp = batch == null ? ZERO : nz(batch.mrp());
            BigDecimal sale = money(
                    mrp.subtract(offerSaving(books.offers(), product.id(), mrp)).max(ZERO));
            rows.add(List.of(
                    product.name(),
                    blank(product.pack()),
                    batch == null || batch.gst() == null ? "—" : batch.gst() + "%",
                    txt(mrp),
                    txt(sale),
                    blank(product.rack())));
        }
        return table(
                List.of(
                        col("item", "Item", false, false),
                        col("pack", "Pack", false, false),
                        col("gst", "GST", false, false),
                        col("mrp", "MRP", true, false),
                        col("sale", "Sale price", true, false),
                        col("rack", "Rack", false, false)),
                rows,
                null,
                rows.isEmpty() ? "No items in stock." : null);
    }

    private static Built stockDetail(ReportBooks books, LocalDate today) {
        List<ReportBooks.Product> products = new ArrayList<>(books.products());
        products.sort(Comparator.comparing(ReportBooks.Product::name));
        List<List<Object>> rows = new ArrayList<>();
        int qty = 0;
        BigDecimal value = ZERO;
        YearMonth month = YearMonth.from(today);
        for (ReportBooks.Product product : products) {
            List<ReportBooks.Batch> batches = new ArrayList<>(product.batches());
            batches.sort(Comparator.comparing(ReportBooks.Batch::batchNo));
            for (ReportBooks.Batch batch : batches) {
                if (batch.qty() <= 0) {
                    continue;
                }
                BigDecimal line = money(nz(batch.rate()).multiply(BigDecimal.valueOf(batch.qty())));
                rows.add(List.of(
                        product.name(),
                        batch.batchNo(),
                        batch.expiry() == null ? "—" : batch.expiry(),
                        toExpiry(batch.expiry(), month),
                        batch.qty(),
                        txt(nz(batch.mrp())),
                        txt(nz(batch.rate())),
                        txt(line)));
                qty += batch.qty();
                value = money(value.add(line));
            }
        }
        return table(
                List.of(
                        col("item", "Item", false, false),
                        col("batch", "Batch", false, false),
                        col("exp", "Expiry", false, false),
                        col("left", "To expiry", false, false),
                        col("qty", "Qty", false, true),
                        col("mrp", "MRP", true, false),
                        col("ptr", "PTR", true, false),
                        col("val", "Value", true, false)),
                rows,
                rows.isEmpty() ? null : List.of("TOTAL", "", "", "", qty, "", "", txt(value)),
                rows.isEmpty() ? "No batches in stock." : null);
    }

    private static Built stockSummary(ReportBooks books, LocalDate today) {
        List<ReportBooks.Product> products = new ArrayList<>(books.products());
        products.sort(Comparator.comparing(ReportBooks.Product::name));
        List<List<Object>> rows = new ArrayList<>();
        int stock = 0;
        BigDecimal value = ZERO;
        YearMonth month = YearMonth.from(today);
        for (ReportBooks.Product product : products) {
            int onHand = units(product);
            ReportBooks.Batch batch = earliest(product, true);
            BigDecimal line = ZERO;
            for (ReportBooks.Batch held : product.batches()) {
                if (held.qty() > 0) {
                    line = money(line.add(money(nz(held.rate()).multiply(BigDecimal.valueOf(held.qty())))));
                }
            }
            String status;
            if (onHand == 0) {
                status = "Out";
            } else if (batch != null && expired(batch.expiry(), month)) {
                status = "Expired";
            } else if (onHand <= product.reorder()) {
                status = "Low";
            } else {
                status = "OK";
            }
            rows.add(List.of(
                    product.name(),
                    blank(product.type()),
                    onHand,
                    txt(batch == null ? ZERO : nz(batch.mrp())),
                    txt(line),
                    status));
            stock += onHand;
            value = money(value.add(line));
        }
        return table(
                List.of(
                        col("item", "Item", false, false),
                        col("cat", "Category", false, false),
                        col("stock", "In stock", false, true),
                        col("mrp", "MRP", true, false),
                        col("val", "Stock value", true, false),
                        col("status", "Status", false, false)),
                rows,
                rows.isEmpty() ? null : List.of("TOTAL", "", stock, "", txt(value), ""),
                rows.isEmpty() ? "No items in stock." : null);
    }

    private static Built ageing(ReportBooks books, LocalDate today) {
        List<OpenBill> open = new ArrayList<>();
        for (Khata khata : khata(books, today)) {
            open.addAll(khata.open);
        }
        open.sort(
                Comparator.comparingInt((OpenBill bill) -> bill.age).reversed().thenComparing(bill -> bill.number));
        List<List<Object>> rows = new ArrayList<>();
        BigDecimal total = ZERO;
        for (OpenBill bill : open) {
            rows.add(List.of(bill.party, bill.number, txt(bill.left), bill.age, bucket(bill.age)));
            total = money(total.add(bill.left));
        }
        return table(
                List.of(
                        col("party", "Party", false, false),
                        col("inv", "Invoice", false, false),
                        col("amt", "Outstanding", true, false),
                        col("age", "Age (days)", false, true),
                        col("bucket", "Bucket", false, false)),
                rows,
                rows.isEmpty() ? null : List.of("TOTAL", "", txt(total), "", ""),
                rows.isEmpty() ? "No outstanding receivables." : null);
    }

    private static Built partyLedger(ReportBooks books, LocalDate from, LocalDate to, LocalDate today) {
        Map<String, Khata> accounts = new LinkedHashMap<>();
        for (Khata khata : khata(books, today)) {
            accounts.put(khata.phone, khata);
        }
        Map<String, Ledger> ledgers = new LinkedHashMap<>();
        for (ReportBooks.Bill bill : books.bills()) {
            ledgers.computeIfAbsent(bill.phone(), ignored -> ledger(accounts, bill.phone(), bill.patientName()));
        }
        for (SaleMove move : saleMoves(books)) {
            if (!inRange(move.day, from, to) || move.phone.isEmpty()) {
                continue;
            }
            Ledger ledger = ledgers.computeIfAbsent(move.phone, ignored -> ledger(accounts, move.phone, move.party));
            ledger.billed = money(ledger.billed.add(move.inclusive));
            if (!"credit".equals(move.payMode)) {
                ledger.received = money(ledger.received.add(move.inclusive));
            }
        }
        for (ReportBooks.Bill bill : books.bills()) {
            if (inRange(bill.soldOn(), from, to)) {
                ledgers.computeIfAbsent(bill.phone(), ignored -> ledger(accounts, bill.phone(), bill.patientName()))
                        .bills++;
            }
        }
        for (ReportBooks.Repayment repayment : books.repayments()) {
            if (!inRange(repayment.on(), from, to)) {
                continue;
            }
            Ledger ledger = ledgers.computeIfAbsent(
                    repayment.phone(), ignored -> ledger(accounts, repayment.phone(), repayment.phone()));
            ledger.received = money(ledger.received.add(repayment.amount()));
        }
        List<Ledger> rowsSource = new ArrayList<>();
        for (Ledger ledger : ledgers.values()) {
            if (ledger.bills > 0 || ledger.outstanding.signum() > 0) {
                rowsSource.add(ledger);
            }
        }
        rowsSource.sort(Comparator.comparing((Ledger ledger) -> ledger.billed)
                .reversed()
                .thenComparing(ledger -> ledger.name));
        List<List<Object>> rows = new ArrayList<>();
        int bills = 0;
        BigDecimal billed = ZERO;
        BigDecimal received = ZERO;
        BigDecimal outstanding = ZERO;
        for (Ledger ledger : rowsSource) {
            rows.add(List.of(
                    ledger.name,
                    ledger.phone,
                    ledger.bills,
                    txt(ledger.billed),
                    txt(ledger.received),
                    txt(ledger.outstanding)));
            bills += ledger.bills;
            billed = money(billed.add(ledger.billed));
            received = money(received.add(ledger.received));
            outstanding = money(outstanding.add(ledger.outstanding));
        }
        return table(
                List.of(
                        col("party", "Party", false, false),
                        col("phone", "Phone", false, false),
                        col("bills", "Bills", false, true),
                        col("billed", "Total billed", true, false),
                        col("paid", "Received", true, false),
                        col("out", "Outstanding", true, false)),
                rows,
                rows.isEmpty() ? null : List.of("TOTAL", "", bills, txt(billed), txt(received), txt(outstanding)),
                rows.isEmpty() ? "No party activity in this period." : null);
    }

    private static Built partyOutstanding(ReportBooks books, LocalDate today) {
        List<Khata> accounts = new ArrayList<>();
        for (Khata khata : khata(books, today)) {
            if (khata.outstanding.signum() > 0) {
                accounts.add(khata);
            }
        }
        accounts.sort(Comparator.comparing((Khata khata) -> khata.outstanding)
                .reversed()
                .thenComparing(khata -> khata.name));
        List<List<Object>> rows = new ArrayList<>();
        BigDecimal total = ZERO;
        for (Khata khata : accounts) {
            rows.add(List.of(khata.name, khata.phone, txt(khata.outstanding), khata.oldest));
            total = money(total.add(khata.outstanding));
        }
        return table(
                List.of(
                        col("party", "Party", false, false),
                        col("phone", "Phone", false, false),
                        col("out", "Outstanding", true, false),
                        col("oldest", "Oldest due (days)", false, true)),
                rows,
                rows.isEmpty() ? null : List.of("TOTAL", "", txt(total), ""),
                rows.isEmpty() ? "No party has outstanding dues." : null);
    }

    private static Built category(ReportBooks books, LocalDate from, LocalDate to) {
        Map<String, ReportBooks.Product> products = products(books);
        Map<String, Slab> groups = new LinkedHashMap<>();
        for (SaleMove move : saleMoves(books)) {
            if (!inRange(move.day, from, to)) {
                continue;
            }
            ReportBooks.Product product = products.get(move.productId);
            String name = product == null ? "—" : blank(product.type());
            Slab slab = groups.computeIfAbsent(name, ignored -> new Slab());
            slab.add(move.qty, move.inclusive, move.gst);
        }
        List<Map.Entry<String, Slab>> entries = new ArrayList<>(groups.entrySet());
        entries.sort(Comparator.<Map.Entry<String, Slab>, BigDecimal>comparing(entry -> entry.getValue().taxable)
                .reversed()
                .thenComparing(Map.Entry::getKey));
        List<List<Object>> rows = new ArrayList<>();
        Slab total = new Slab();
        for (Map.Entry<String, Slab> entry : entries) {
            if (entry.getValue().qty == 0 && entry.getValue().total.signum() == 0) {
                continue;
            }
            rows.add(List.of(
                    entry.getKey(),
                    entry.getValue().qty,
                    txt(entry.getValue().taxable),
                    txt(entry.getValue().tax),
                    txt(entry.getValue().total)));
            total.add(entry.getValue());
        }
        return table(
                List.of(
                        col("cat", "Category", false, false),
                        col("qty", "Qty", false, true),
                        col("taxable", "Taxable", true, false),
                        col("tax", "GST", true, false),
                        col("total", "Total", true, false)),
                rows,
                rows.isEmpty()
                        ? null
                        : List.of("TOTAL", total.qty, txt(total.taxable), txt(total.tax), txt(total.total)),
                rows.isEmpty() ? "No sales in this period." : null);
    }

    private static List<SaleMove> saleMoves(ReportBooks books) {
        List<SaleMove> moves = new ArrayList<>();
        Map<String, ReportBooks.Bill> bills = billsByNumber(books);
        for (ReportBooks.Bill bill : books.bills()) {
            Map<Integer, BigDecimal> payable = linePayables(bill);
            for (ReportBooks.BillLine line : bill.lines()) {
                BigDecimal inclusive = payable.getOrDefault(line.position(), ZERO);
                moves.add(new SaleMove(
                        bill.soldOn(),
                        bill.number(),
                        bill.phone(),
                        bill.patientName(),
                        bill.payMode(),
                        line.productId(),
                        line.name(),
                        line.qty(),
                        inclusive,
                        line.gst(),
                        money(nz(line.batchRate()).multiply(BigDecimal.valueOf(line.qty())))));
            }
        }
        for (ReportBooks.SaleReturn returned : books.saleReturns()) {
            ReportBooks.Bill bill = bills.get(returned.billNumber());
            if (returned.lines().isEmpty()) {
                moves.add(new SaleMove(
                        returned.on(),
                        returned.billNumber(),
                        bill == null ? "" : bill.phone(),
                        bill == null ? "" : bill.patientName(),
                        bill == null ? "cash" : bill.payMode(),
                        "",
                        "",
                        0,
                        returned.amount().negate(),
                        0,
                        ZERO));
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
                        returned.billNumber(),
                        bill == null ? "" : bill.phone(),
                        bill == null ? "" : bill.patientName(),
                        bill == null ? "cash" : bill.payMode(),
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
        Map<String, ReportBooks.Purchase> purchases = purchasesByCode(books);
        for (ReportBooks.Purchase purchase : books.purchases()) {
            for (ReportBooks.PurchaseLine line : purchase.lines()) {
                moves.add(purchaseMove(
                        purchase.on(), line.productId(), line.name(), line.qty(), line.rate(), line.gst()));
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
                PurchaseMove move = purchaseMove(
                        returned.on(), source.productId(), source.name(), line.qty(), source.rate(), source.gst());
                moves.add(new PurchaseMove(
                        move.day,
                        move.productId,
                        move.item,
                        -move.qty,
                        move.gst,
                        move.taxable.negate(),
                        move.tax.negate(),
                        move.total.negate()));
            }
        }
        return moves;
    }

    private static PurchaseMove purchaseMove(
            LocalDate day, String productId, String name, int qty, BigDecimal rate, int gst) {
        BigDecimal taxable = money(nz(rate).multiply(BigDecimal.valueOf(qty)));
        BigDecimal tax = gstOn(taxable, gst);
        return new PurchaseMove(day, productId, name, qty, gst, taxable, tax, money(taxable.add(tax)));
    }

    private static List<Khata> khata(ReportBooks books, LocalDate today) {
        Map<String, List<ReportBooks.Bill>> credit = new LinkedHashMap<>();
        Map<String, String> names = new LinkedHashMap<>();
        Map<String, Instant> latest = new LinkedHashMap<>();
        for (ReportBooks.Bill bill : books.bills()) {
            Instant prior = latest.get(bill.phone());
            if (prior == null || bill.soldAt().isAfter(prior)) {
                latest.put(bill.phone(), bill.soldAt());
                names.put(bill.phone(), bill.patientName());
            }
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
            names.putIfAbsent(repayment.phone(), repayment.phone());
        }
        List<Khata> accounts = new ArrayList<>();
        for (Map.Entry<String, String> entry : names.entrySet()) {
            String phone = entry.getKey();
            List<ReportBooks.Bill> bills = new ArrayList<>(credit.getOrDefault(phone, List.of()));
            bills.sort(Comparator.comparing(ReportBooks.Bill::soldAt).thenComparing(ReportBooks.Bill::number));
            BigDecimal pool = repaid.getOrDefault(phone, ZERO);
            List<OpenBill> open = new ArrayList<>();
            int oldest = 0;
            boolean first = true;
            BigDecimal outstanding = ZERO;
            for (ReportBooks.Bill bill : bills) {
                BigDecimal net = money(bill.payable().subtract(refunds.getOrDefault(bill.number(), ZERO)))
                        .max(ZERO);
                BigDecimal left = money(net.subtract(pool)).max(ZERO);
                pool = money(pool.subtract(net)).max(ZERO);
                if (left.signum() > 0) {
                    int age = age(bill.soldOn(), today);
                    if (first) {
                        oldest = age;
                        first = false;
                    }
                    open.add(new OpenBill(entry.getValue(), bill.number(), left, age));
                    outstanding = money(outstanding.add(left));
                }
            }
            accounts.add(new Khata(phone, entry.getValue(), outstanding, oldest, open));
        }
        return accounts;
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

    static List<BigDecimal> extraShares(List<BigDecimal> lineNets, BigDecimal extra) {
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

    static BigDecimal refund(BigDecimal linePayable, int qty, int alreadyReturned, int take) {
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

    private static BigDecimal offerSaving(List<ReportBooks.Offer> offers, String productId, BigDecimal mrp) {
        ReportBooks.Offer best = null;
        BigDecimal saving = ZERO;
        for (ReportBooks.Offer offer : offers) {
            boolean product = "product".equals(offer.scope());
            if (product && !productId.equals(offer.productId())) {
                continue;
            }
            if (!product && !"all".equals(offer.scope())) {
                continue;
            }
            BigDecimal unit = "pct".equals(offer.type())
                    ? money(mrp.multiply(nz(offer.value())).divide(HUNDRED, 2, RoundingMode.HALF_UP))
                    : money(nz(offer.value()).min(mrp));
            if (unit.signum() <= 0) {
                continue;
            }
            int compare = unit.compareTo(saving);
            if (best == null || compare > 0 || (compare == 0 && preferred(offer, best))) {
                best = offer;
                saving = unit;
            }
        }
        return saving;
    }

    private static boolean preferred(ReportBooks.Offer offer, ReportBooks.Offer current) {
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

    private static List<Object> slabRow(String label, Slab slab) {
        BigDecimal cgst = money(slab.tax.divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP));
        BigDecimal sgst = money(slab.tax.subtract(cgst));
        return List.of(label, slab.qty, txt(slab.taxable), txt(cgst), txt(sgst), txt(slab.tax), txt(slab.total));
    }

    private static List<Column> gstColumns() {
        return List.of(
                col("k", "GST slab", false, false),
                col("qty", "Qty", false, true),
                col("taxable", "Taxable", true, false),
                col("cgst", "CGST", true, false),
                col("sgst", "SGST", true, false),
                col("tax", "Total tax", true, false),
                col("total", "Total", true, false));
    }

    private static List<Column> statementColumns() {
        return List.of(col("p", "Particulars", false, false), col("amt", "Amount", true, false));
    }

    private static Built table(List<Column> columns, List<List<Object>> rows, List<Object> totals, String note) {
        return new Built(columns, rows, totals, note);
    }

    private static Column col(String key, String label, boolean money, boolean num) {
        return new Column(key, label, money, num);
    }

    private static BigDecimal taxableOf(BigDecimal inclusive, int gst) {
        if (gst <= 0) {
            return money(inclusive);
        }
        BigDecimal divisor = BigDecimal.ONE.add(BigDecimal.valueOf(gst).movePointLeft(2));
        return money(inclusive.divide(divisor, 2, RoundingMode.HALF_UP));
    }

    private static BigDecimal gstPart(BigDecimal amount, int gst) {
        return money(amount.subtract(taxableOf(amount, gst)));
    }

    private static BigDecimal gstOn(BigDecimal taxable, int gst) {
        if (gst <= 0) {
            return ZERO;
        }
        return money(taxable.multiply(BigDecimal.valueOf(gst)).divide(HUNDRED, 2, RoundingMode.HALF_UP));
    }

    private static String percent(BigDecimal profit, BigDecimal taxable) {
        if (taxable.signum() == 0) {
            return "0%";
        }
        return profit.multiply(HUNDRED).divide(taxable, 0, RoundingMode.HALF_UP).toPlainString() + "%";
    }

    private static String bucket(int age) {
        if (age <= 30) {
            return "0–30";
        }
        if (age <= 60) {
            return "31–60";
        }
        if (age <= 90) {
            return "61–90";
        }
        return "90+";
    }

    private static int age(LocalDate soldOn, LocalDate today) {
        long days = ChronoUnit.DAYS.between(soldOn, today);
        return (int) Math.max(0, days);
    }

    private static boolean inRange(LocalDate day, LocalDate from, LocalDate to) {
        return day != null && !day.isBefore(from) && !day.isAfter(to);
    }

    private static String blank(String value) {
        return value == null || value.isBlank() ? "—" : value;
    }

    private static String modeLabel(String mode) {
        return switch (mode == null ? "" : mode) {
            case "cash" -> "Cash";
            case "upi" -> "UPI";
            case "card" -> "Card";
            case "cod" -> "Cash on Delivery";
            case "bank_transfer" -> "Bank transfer";
            default -> mode == null || mode.isBlank() ? "Recorded" : mode;
        };
    }

    private static String time(Instant instant) {
        return TIME.format(instant);
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

    private static String csvRow(List<Object> row) {
        List<String> cells = new ArrayList<>();
        for (Object cell : row) {
            cells.add(csvCell(cell));
        }
        return String.join(",", cells);
    }

    private static String csvCell(Object value) {
        String text = value == null ? "" : String.valueOf(value);
        if (text.indexOf(',') >= 0 || text.indexOf('"') >= 0 || text.indexOf('\n') >= 0) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }

    private static Map<String, ReportBooks.Bill> billsByNumber(ReportBooks books) {
        Map<String, ReportBooks.Bill> bills = new LinkedHashMap<>();
        for (ReportBooks.Bill bill : books.bills()) {
            bills.put(bill.number(), bill);
        }
        return bills;
    }

    private static Map<String, ReportBooks.Purchase> purchasesByCode(ReportBooks books) {
        Map<String, ReportBooks.Purchase> purchases = new LinkedHashMap<>();
        for (ReportBooks.Purchase purchase : books.purchases()) {
            purchases.put(purchase.code(), purchase);
        }
        return purchases;
    }

    private static Map<String, String> namesByPhone(ReportBooks books) {
        Map<String, String> names = new LinkedHashMap<>();
        Map<String, Instant> latest = new LinkedHashMap<>();
        for (ReportBooks.Bill bill : books.bills()) {
            Instant prior = latest.get(bill.phone());
            if (prior == null || bill.soldAt().isAfter(prior)) {
                latest.put(bill.phone(), bill.soldAt());
                names.put(bill.phone(), bill.patientName());
            }
        }
        return names;
    }

    private static Map<String, ReportBooks.Product> products(ReportBooks books) {
        Map<String, ReportBooks.Product> products = new LinkedHashMap<>();
        for (ReportBooks.Product product : books.products()) {
            products.put(product.id(), product);
        }
        return products;
    }

    private static String itemName(Map<String, ReportBooks.Product> products, String productId, String fallback) {
        ReportBooks.Product product = products.get(productId);
        if (product != null && product.name() != null && !product.name().isBlank()) {
            return product.name();
        }
        return fallback == null || fallback.isBlank() ? productId : fallback;
    }

    private static int units(ReportBooks.Product product) {
        int total = 0;
        for (ReportBooks.Batch batch : product.batches()) {
            total += Math.max(batch.qty(), 0);
        }
        return total;
    }

    private static ReportBooks.Batch earliest(ReportBooks.Product product, boolean inStock) {
        ReportBooks.Batch best = null;
        for (ReportBooks.Batch batch : product.batches()) {
            if (inStock && batch.qty() <= 0) {
                continue;
            }
            if (best == null || expiry(batch).compareTo(expiry(best)) < 0) {
                best = batch;
            }
        }
        return best;
    }

    private static YearMonth expiry(ReportBooks.Batch batch) {
        try {
            return YearMonth.parse(batch.expiry());
        } catch (RuntimeException exception) {
            return YearMonth.of(1900, 1);
        }
    }

    private static boolean expired(String expiry, YearMonth today) {
        try {
            return YearMonth.parse(expiry).isBefore(today);
        } catch (RuntimeException exception) {
            return true;
        }
    }

    private static String toExpiry(String expiry, YearMonth today) {
        YearMonth month;
        try {
            month = YearMonth.parse(expiry);
        } catch (RuntimeException exception) {
            return "Expired";
        }
        if (month.isBefore(today)) {
            return "Expired";
        }
        int months = (month.getYear() - today.getYear()) * 12 + month.getMonthValue() - today.getMonthValue();
        return months + "mo";
    }

    private static Ledger ledger(Map<String, Khata> accounts, String phone, String fallback) {
        Khata khata = accounts.get(phone);
        return new Ledger(phone, khata == null ? fallback : khata.name, khata == null ? ZERO : khata.outstanding);
    }

    private static Map<String, Meta> catalog() {
        Map<String, Meta> catalog = new LinkedHashMap<>();
        add(catalog, "gstr1", "GSTR-1 (Sales)", "Outward supplies, slab-wise", false);
        add(catalog, "pnl", "Profit And Loss Report", "Income, COGS & gross profit", false);
        add(catalog, "sales-summary", "Sales Summary", "Sales dashboard & trends", false);
        add(catalog, "gstr2", "GSTR-2 (Purchase)", "Inward supplies, slab-wise", false);
        add(catalog, "gstr3b", "GSTR-3b", "Output vs input — net GST", false);
        add(catalog, "audit-trail", "Audit Trail", "Every document, time-stamped", false);
        add(catalog, "bill-wise-profit", "Bill Wise Profit", "Profit & margin per invoice", false);
        add(catalog, "cash-bank", "Cash and Bank Report (All Payments)", "Collections by mode", false);
        add(catalog, "daybook", "Daybook", "Net sales vs purchases per day", false);
        add(catalog, "expense-category", "Expense Category Report", "Expenses grouped by head", false);
        add(catalog, "expense-transaction", "Expense Transaction Report", "Every expense entry", false);
        add(catalog, "purchase-summary", "Purchase Summary", "GRN-wise inward purchases", false);
        add(catalog, "item-by-party", "Item Report By Party", "Who bought each item", false);
        add(catalog, "item-sales-purchase", "Item Sales and Purchase Summary", "Sold vs purchased per item", false);
        add(catalog, "low-stock", "Low Stock Summary", "Items at/under reorder level", true);
        add(catalog, "rate-list", "Rate List", "MRP & sale price per item", true);
        add(catalog, "stock-detail", "Stock Detail Report", "Batch-wise stock & expiry", true);
        add(catalog, "stock-summary", "Stock Summary", "Stock & value per item", true);
        add(catalog, "receivable-ageing", "Receivable Ageing Report", "Outstanding by age bucket", true);
        add(catalog, "party-by-item", "Party Report By Item", "What each party bought", false);
        add(catalog, "party-ledger", "Party Statement (Ledger)", "Billed, paid & outstanding", false);
        add(catalog, "party-outstanding", "Party Wise Outstanding", "Dues per party", true);
        add(catalog, "sales-category-wise", "Sales Summary - Category Wise", "Sales grouped by category", false);
        return Map.copyOf(catalog);
    }

    private static void add(Map<String, Meta> catalog, String id, String name, String description, boolean snapshot) {
        catalog.put(id, new Meta(name, description, snapshot));
    }

    private record Meta(String name, String description, boolean snapshot) {}

    private record Built(List<Column> columns, List<List<Object>> rows, List<Object> totals, String note) {}

    private static final class Slab {
        private int qty;
        private BigDecimal taxable = ZERO;
        private BigDecimal tax = ZERO;
        private BigDecimal total = ZERO;

        private void add(int quantity, BigDecimal inclusive, int gst) {
            BigDecimal lineTaxable = taxableOf(inclusive, gst);
            BigDecimal lineTax = money(inclusive.subtract(lineTaxable));
            add(quantity, lineTaxable, lineTax, inclusive);
        }

        private void add(int quantity, BigDecimal lineTaxable, BigDecimal lineTax, BigDecimal lineTotal) {
            qty += quantity;
            taxable = money(taxable.add(lineTaxable));
            tax = money(tax.add(lineTax));
            total = money(total.add(lineTotal));
        }

        private void add(Slab other) {
            add(other.qty, other.taxable, other.tax, other.total);
        }
    }

    private record SaleMove(
            LocalDate day,
            String billNumber,
            String phone,
            String party,
            String payMode,
            String productId,
            String item,
            int qty,
            BigDecimal inclusive,
            int gst,
            BigDecimal cogs) {}

    private record PurchaseMove(
            LocalDate day,
            String productId,
            String item,
            int qty,
            int gst,
            BigDecimal taxable,
            BigDecimal tax,
            BigDecimal total) {}

    private static final class ExpenseAcc {
        private int count;
        private BigDecimal tax = ZERO;
        private BigDecimal amount = ZERO;
    }

    private static final class ItemAcc {
        private final String a;
        private final String b;
        private int qty;
        private BigDecimal value = ZERO;

        private ItemAcc(String a, String b) {
            this.a = a;
            this.b = b;
        }
    }

    private static final class Flow {
        private final String name;
        private int soldQty;
        private int purchQty;
        private BigDecimal sold = ZERO;
        private BigDecimal purch = ZERO;

        private Flow(String name) {
            this.name = name;
        }
    }

    private record Event(
            Instant at,
            String id,
            String when,
            String document,
            String type,
            String party,
            BigDecimal amount,
            String status) {}

    private record OpenBill(String party, String number, BigDecimal left, int age) {}

    private record Khata(String phone, String name, BigDecimal outstanding, int oldest, List<OpenBill> open) {}

    private static final class Ledger {
        private final String phone;
        private final String name;
        private final BigDecimal outstanding;
        private int bills;
        private BigDecimal billed = ZERO;
        private BigDecimal received = ZERO;

        private Ledger(String phone, String name, BigDecimal outstanding) {
            this.phone = phone;
            this.name = name;
            this.outstanding = outstanding;
        }
    }
}
