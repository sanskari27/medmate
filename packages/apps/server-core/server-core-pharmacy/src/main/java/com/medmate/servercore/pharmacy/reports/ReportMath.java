package com.medmate.servercore.pharmacy.reports;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.InvoiceMath;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import org.springframework.stereotype.Component;

@Component
public class ReportMath {
    private final ObjectMapper mapper;

    public ReportMath(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode run(String id, ObjectNode state, long from, long to, long now) {
        List<ObjectNode> sales = inRange(state, "sales", from, to, true);
        List<ObjectNode> purchases = inRange(state, "purchases", from, to, false);
        List<ObjectNode> expenses = inRange(state, "expenses", from, to, false);
        return switch (id) {
            case "gstr1", "gst-sales-hsn" -> gstSales(id, sales);
            case "gstr2", "gst-purchase-hsn" -> gstPurchases(id, purchases);
            case "hsn-sales-summary" -> hsn(sales);
            case "gstr3b" -> gstr3b(sales, purchases);
            case "tcs-receivable" -> tcs(sales, now);
            case "tds-payable", "tds-receivable", "tcs-payable" -> emptyTax(id);
            case "expense-category" -> expenseCategory(expenses);
            case "expense-transaction" -> expenseRows(expenses);
            case "audit-trail" -> audit(sales, purchases);
            case "bill-wise-profit" -> profit(state, sales);
            case "cash-bank" -> cash(sales);
            case "daybook" -> daybook(sales, purchases);
            case "purchase-summary" -> purchaseSummary(purchases);
            case "item-by-party", "party-by-item" -> partyItems(id, sales);
            case "item-sales-purchase" -> movement(state, sales, purchases);
            case "low-stock" -> low(state);
            case "rate-list" -> rates(state);
            case "stock-detail" -> detail(state, now);
            case "stock-summary" -> summary(state, now);
            case "receivable-ageing" -> ageing(state, now);
            case "party-ledger", "party-outstanding" -> parties(id, state, from, to, now);
            case "sales-category-wise" -> categories(state, sales);
            case "balance-sheet" -> balance(state, sales, purchases, expenses);
            case "pnl" -> pnl(state, sales, expenses);
            case "sales-summary" -> salesSummary(sales);
            default -> new ReportSheet(mapper).columns("x|—").note("This report is not available.").build();
        };
    }

    private List<ObjectNode> inRange(ObjectNode state, String field, long from, long to, boolean sales) {
        List<ObjectNode> rows = new ArrayList<>();
        for (JsonNode node : state.withArray(field)) {
            if (!(node instanceof ObjectNode row)) {
                continue;
            }
            if (sales && "cancelled".equals(row.path("status").asText())) {
                continue;
            }
            long at = field.equals("expenses") ? row.path("date").asLong() : row.path("createdAt").asLong();
            if (at >= from && at <= to) {
                rows.add(row);
            }
        }
        return rows;
    }

    private ObjectNode gstSales(String id, List<ObjectNode> sales) {
        boolean byHsn = "gst-sales-hsn".equals(id);
        Map<String, double[]> groups = new TreeMap<>();
        for (ObjectNode sale : sales) {
            for (JsonNode item : sale.withArray("items")) {
                String key = byHsn ? item.path("hsn").asText("—") : String.valueOf(item.path("gst").asDouble());
                double taxable = ReportService.exclusive(item.path("price").asDouble(), item.path("qty").asDouble(), item.path("gst").asDouble());
                double[] bucket = groups.computeIfAbsent(key, ignored -> new double[3]);
                bucket[0] += taxable;
                bucket[1] += item.path("price").asDouble() * item.path("qty").asDouble() - taxable;
                bucket[2] += item.path("qty").asDouble();
            }
        }
        ReportSheet sheet = slab(byHsn);
        groups.forEach((key, bucket) -> sheet.row(byHsn ? key : key + "%", bucket[2], ReportService.round(bucket[0]), ReportService.round(bucket[1] / 2), ReportService.round(bucket[1] / 2), ReportService.round(bucket[1]), ReportService.round(bucket[0] + bucket[1])));
        return finish(sheet, groups.isEmpty() ? "No outward (sales) supplies in this period." : null);
    }

    private ObjectNode gstPurchases(String id, List<ObjectNode> purchases) {
        boolean byHsn = "gst-purchase-hsn".equals(id);
        Map<String, double[]> groups = new TreeMap<>();
        for (ObjectNode purchase : purchases) {
            for (JsonNode item : purchase.withArray("items")) {
                String key = byHsn ? item.path("hsn").asText("—") : String.valueOf(item.path("gst").asDouble());
                double taxable = item.path("ptr").asDouble() * item.path("qty").asDouble();
                double[] bucket = groups.computeIfAbsent(key, ignored -> new double[3]);
                bucket[0] += taxable;
                bucket[1] += taxable * item.path("gst").asDouble() / 100;
                bucket[2] += item.path("qty").asDouble();
            }
        }
        ReportSheet sheet = slab(byHsn);
        groups.forEach((key, bucket) -> sheet.row(byHsn ? key : key + "%", bucket[2], ReportService.round(bucket[0]), ReportService.round(bucket[1] / 2), ReportService.round(bucket[1] / 2), ReportService.round(bucket[1]), ReportService.round(bucket[0] + bucket[1])));
        return finish(sheet, groups.isEmpty() ? "No inward (purchase) supplies in this period." : null);
    }

    private ReportSheet slab(boolean byHsn) {
        return new ReportSheet(mapper).columns((byHsn ? "k|HSN" : "k|GST slab"), "qty|Qty|num", "taxable|Taxable|money", "cgst|CGST|money", "sgst|SGST|money", "tax|Total tax|money", "total|Total|money");
    }

    private ObjectNode hsn(List<ObjectNode> sales) {
        Map<String, double[]> groups = new TreeMap<>();
        for (ObjectNode sale : sales) {
            for (JsonNode item : sale.withArray("items")) {
                double taxable = ReportService.exclusive(item.path("price").asDouble(), item.path("qty").asDouble(), item.path("gst").asDouble());
                double[] bucket = groups.computeIfAbsent(item.path("hsn").asText("—"), ignored -> new double[]{0, 0, 0, item.path("gst").asDouble()});
                bucket[0] += item.path("qty").asDouble();
                bucket[1] += taxable;
                bucket[2] += item.path("price").asDouble() * item.path("qty").asDouble() - taxable;
            }
        }
        ReportSheet sheet = new ReportSheet(mapper).columns("hsn|HSN", "rate|GST", "qty|Qty|num", "taxable|Taxable|money", "tax|Tax|money", "total|Total|money");
        groups.forEach((key, bucket) -> sheet.row(key, bucket[3] + "%", bucket[0], ReportService.round(bucket[1]), ReportService.round(bucket[2]), ReportService.round(bucket[1] + bucket[2])));
        return finish(sheet, groups.isEmpty() ? "No sales in this period." : null);
    }

    private ObjectNode gstr3b(List<ObjectNode> sales, List<ObjectNode> purchases) {
        double outTaxable = 0, outTax = 0, inTaxable = 0, inTax = 0;
        for (ObjectNode sale : sales) {
            InvoiceMath.Totals totals = ReportService.totals(sale);
            outTaxable += totals.taxable();
            outTax += totals.totalTax();
        }
        for (ObjectNode purchase : purchases) {
            for (JsonNode item : purchase.withArray("items")) {
                double taxable = item.path("ptr").asDouble() * item.path("qty").asDouble();
                inTaxable += taxable;
                inTax += taxable * item.path("gst").asDouble() / 100;
            }
        }
        double net = outTax - inTax;
        return new ReportSheet(mapper).columns("d|Description", "taxable|Taxable value|money", "tax|Tax|money")
                .row("3.1 Outward taxable supplies", ReportService.round(outTaxable), ReportService.round(outTax))
                .row("4. Eligible ITC (inward)", ReportService.round(inTaxable), ReportService.round(inTax))
                .totals(net >= 0 ? "Net GST payable" : "Net GST credit (c/f)", "", ReportService.round(Math.abs(net))).build();
    }

    private ObjectNode tcs(List<ObjectNode> sales, long now) {
        ReportSheet sheet = new ReportSheet(mapper).columns("inv|Invoice", "date|Date", "party|Party", "order|Order value|money", "tcs|TCS 1%|money", "status|Status");
        double gross = 0, tcs = 0;
        int count = 0;
        for (ObjectNode sale : sales) {
            if (!"online".equals(sale.path("channel").asText())) {
                continue;
            }
            double payable = ReportService.totals(sale).payable();
            boolean settled = now >= sale.path("createdAt").asLong() + 7L * 86400000 && ("delivered".equals(sale.path("status").asText()) || "completed".equals(sale.path("status").asText()));
            sheet.row(sale.path("id").asText(), ReportService.day(sale.path("createdAt").asLong()), sale.path("customer").path("name").asText(), ReportService.round(payable), ReportService.round(payable * 0.01), settled ? "Settled" : "Pending");
            gross += payable;
            tcs += payable * 0.01;
            count++;
        }
        sheet.totals("TOTAL", "", "", ReportService.round(gross), ReportService.round(tcs), "");
        return sheet.note(count == 0 ? "No online orders with TCS in this period." : "TCS withheld by Namma MedMate u/s 52 — claimable against your GST liability.").build();
    }

    private ObjectNode emptyTax(String id) {
        String note = switch (id) {
            case "tds-receivable" -> "No TDS deducted by customers in this period.";
            case "tcs-payable" -> "No TCS collected as a seller in this period.";
            default -> "No TDS deducted on payments in this period.";
        };
        if ("tcs-payable".equals(id)) {
            return new ReportSheet(mapper).columns("d|Buyer", "base|Sale value|money", "tcs|TCS|money").note(note).build();
        }
        return new ReportSheet(mapper).columns("d|" + ("tds-receivable".equals(id) ? "Deductor" : "Deductee"), "sec|Section", "base|Amount|money", "tds|TDS|money").note(note).build();
    }

    private ObjectNode finish(ReportSheet sheet, String note) {
        ObjectNode built = sheet.build();
        int[] sums = new int[8];
        for (JsonNode row : built.withArray("rows")) {
            for (int index = 1; index < row.size() && index < sums.length; index++) {
                if (row.get(index).isNumber()) {
                    sums[index] += ReportService.round(row.get(index).asDouble());
                }
            }
        }
        if (built.withArray("rows").isEmpty()) {
            return sheet.note(note).build();
        }
        if (built.get("columns").size() == 6) {
            return sheet.totals("TOTAL", "", sums[2], sums[3], sums[4], sums[5]).note(note).build();
        }
        return sheet.totals("TOTAL", sums[1], sums[2], sums[3], sums[4], sums[5], sums[6]).note(note).build();
    }

    private ObjectNode expenseCategory(List<ObjectNode> expenses) {
        Map<String, double[]> groups = new LinkedHashMap<>();
        for (ObjectNode expense : expenses) {
            double gst = expense.path("gst").asDouble();
            double taxable = gst == 0 ? expense.path("amount").asDouble() : expense.path("amount").asDouble() / (1 + gst / 100);
            double[] bucket = groups.computeIfAbsent(expense.path("category").asText(), ignored -> new double[4]);
            bucket[0]++;
            bucket[1] += taxable;
            bucket[2] += expense.path("amount").asDouble() - taxable;
            bucket[3] += expense.path("amount").asDouble();
        }
        List<Map.Entry<String, double[]>> ordered = new ArrayList<>(groups.entrySet());
        ordered.sort(Comparator.comparingDouble(entry -> -entry.getValue()[3]));
        ReportSheet sheet = new ReportSheet(mapper).columns("cat|Category", "count|Entries|num", "taxable|Taxable|money", "tax|GST|money", "amt|Amount|money");
        ordered.forEach(entry -> sheet.row(entry.getKey(), entry.getValue()[0], ReportService.round(entry.getValue()[1]), ReportService.round(entry.getValue()[2]), ReportService.round(entry.getValue()[3])));
        return sheet.note(ordered.isEmpty() ? "No expenses recorded in this period — add them under Expenses." : null).build();
    }

    private ObjectNode expenseRows(List<ObjectNode> expenses) {
        expenses.sort(Comparator.comparingLong(expense -> -expense.path("date").asLong()));
        ReportSheet sheet = new ReportSheet(mapper).columns("no|Expense no", "date|Date", "party|Paid to", "cat|Category", "pay|Mode", "amt|Amount|money");
        int total = 0;
        for (ObjectNode expense : expenses) {
            int amount = ReportService.round(expense.path("amount").asDouble());
            total += amount;
            sheet.row(expense.path("number").asText(), ReportService.day(expense.path("date").asLong()), expense.path("party").asText(), expense.path("category").asText(), ReportService.pay(expense.path("paymentMode").asText()), amount);
        }
        return sheet.totals("TOTAL", "", "", "", "", total).note(expenses.isEmpty() ? "No expenses recorded in this period — add them under Expenses." : null).build();
    }

    private ObjectNode audit(List<ObjectNode> sales, List<ObjectNode> purchases) {
        List<Object[]> events = new ArrayList<>();
        for (ObjectNode sale : sales) {
            JsonNode history = sale.path("history");
            if (!history.isArray() || history.isEmpty()) {
                events.add(new Object[]{sale.path("createdAt").asLong(), sale, null});
            } else {
                history.forEach(event -> events.add(new Object[]{event.path("at").asLong(), sale, event}));
            }
        }
        for (ObjectNode purchase : purchases) {
            events.add(new Object[]{purchase.path("createdAt").asLong(), purchase});
        }
        events.sort(Comparator.comparingLong(event -> -((Long) event[0])));
        ReportSheet sheet = new ReportSheet(mapper).columns("time|Time", "doc|Document", "type|Type", "party|Party", "amt|Amount|money", "status|Status");
        for (Object[] event : events) {
            if (event.length == 2) {
                ObjectNode purchase = (ObjectNode) event[1];
                double total = 0;
                for (JsonNode item : purchase.withArray("items")) {
                    double taxable = item.path("ptr").asDouble() * item.path("qty").asDouble();
                    total += taxable + taxable * item.path("gst").asDouble() / 100;
                }
                sheet.row(ReportService.stamp((Long) event[0]), purchase.path("id").asText(), "Purchase", purchase.path("supplierName").asText(), ReportService.round(total), "Recorded");
            } else {
                ObjectNode sale = (ObjectNode) event[1];
                JsonNode history = (JsonNode) event[2];
                String status = history == null ? sale.path("status").asText() : history.path("status").asText();
                sheet.row(ReportService.stamp((Long) event[0]), sale.path("id").asText(), "Sale", sale.path("customer").path("name").asText(), ReportService.round(ReportService.totals(sale).payable()), ReportService.status(status));
            }
        }
        return sheet.note(events.isEmpty() ? "No documents in this period." : null).build();
    }

    private ObjectNode profit(ObjectNode state, List<ObjectNode> sales) {
        ReportSheet sheet = new ReportSheet(mapper).columns("inv|Invoice", "date|Date", "party|Party", "rev|Sale (ex-GST)|money", "cogs|COGS|money", "profit|Profit|money", "margin|Margin|num");
        for (ObjectNode sale : sales) {
            InvoiceMath.Totals totals = ReportService.totals(sale);
            double cogs = 0;
            for (JsonNode item : sale.withArray("items")) {
                cogs += ReportService.cost(state, item.path("productId").asText()) * item.path("qty").asDouble();
            }
            double gain = totals.taxable() - cogs;
            sheet.row(sale.path("id").asText(), ReportService.day(sale.path("createdAt").asLong()), sale.path("customer").path("name").asText(), ReportService.round(totals.taxable()), ReportService.round(cogs), ReportService.round(gain), (totals.taxable() > 0 ? Math.round(gain / totals.taxable() * 100) : 0) + "%");
        }
        return sheet.note(sales.isEmpty() ? "No sales in this period." : null).build();
    }

    private ObjectNode cash(List<ObjectNode> sales) {
        ReportSheet sheet = new ReportSheet(mapper).columns("mode|Payment mode", "acct|Account", "bills|Bills|num", "amt|Collected|money");
        for (String mode : List.of("cash", "upi", "card", "cod")) {
            int bills = 0;
            double amount = 0;
            for (ObjectNode sale : sales) {
                if (mode.equals(sale.path("payMode").asText())) {
                    bills++;
                    amount += ReportService.totals(sale).payable();
                }
            }
            sheet.row(ReportService.pay(mode), "cash".equals(mode) ? "Cash" : "Bank", bills, ReportService.round(amount));
        }
        return sheet.build();
    }

    private ObjectNode daybook(List<ObjectNode> sales, List<ObjectNode> purchases) {
        Map<String, double[]> days = new LinkedHashMap<>();
        for (ObjectNode sale : sales) {
            days.computeIfAbsent(ReportService.day(sale.path("createdAt").asLong()), ignored -> new double[2])[0] += ReportService.totals(sale).payable();
        }
        for (ObjectNode purchase : purchases) {
            double total = 0;
            for (JsonNode item : purchase.withArray("items")) {
                double taxable = item.path("ptr").asDouble() * item.path("qty").asDouble();
                total += taxable + taxable * item.path("gst").asDouble() / 100;
            }
            days.computeIfAbsent(ReportService.day(purchase.path("createdAt").asLong()), ignored -> new double[2])[1] += total;
        }
        ReportSheet sheet = new ReportSheet(mapper).columns("day|Day", "sales|Net sales|money", "purch|Purchases|money", "net|Net cash flow|money");
        days.forEach((day, values) -> sheet.row(day, ReportService.round(values[0]), ReportService.round(values[1]), ReportService.round(values[0] - values[1])));
        return sheet.note(days.isEmpty() ? "No activity in this period." : null).build();
    }

    private ObjectNode purchaseSummary(List<ObjectNode> purchases) {
        ReportSheet sheet = new ReportSheet(mapper).columns("grn|GRN", "date|Date", "supplier|Supplier", "inv|Invoice no", "items|Items|num", "taxable|Taxable|money", "gst|GST|money", "total|Total|money");
        for (ObjectNode purchase : purchases) {
            double taxable = 0, gst = 0;
            for (JsonNode item : purchase.withArray("items")) {
                double line = item.path("ptr").asDouble() * item.path("qty").asDouble();
                taxable += line;
                gst += line * item.path("gst").asDouble() / 100;
            }
            sheet.row(purchase.path("id").asText(), ReportService.day(purchase.path("createdAt").asLong()), purchase.path("supplierName").asText(), purchase.path("invoiceNo").asText(), purchase.withArray("items").size(), ReportService.round(taxable), ReportService.round(gst), ReportService.round(taxable + gst));
        }
        return sheet.note(purchases.isEmpty() ? "No purchases (GRNs) in this period." : null).build();
    }

    private ObjectNode partyItems(String id, List<ObjectNode> sales) {
        boolean partyFirst = "party-by-item".equals(id);
        Map<String, double[]> groups = new LinkedHashMap<>();
        Map<String, String[]> labels = new LinkedHashMap<>();
        for (ObjectNode sale : sales) {
            String party = sale.path("customer").path("name").asText() + (sale.path("customer").path("phone").asText("").isEmpty() ? "" : " · " + sale.path("customer").path("phone").asText());
            for (JsonNode item : sale.withArray("items")) {
                String key = partyFirst ? party + "||" + item.path("name").asText() : item.path("name").asText() + "||" + party;
                double[] bucket = groups.computeIfAbsent(key, ignored -> new double[2]);
                bucket[0] += item.path("qty").asDouble();
                bucket[1] += ReportService.exclusive(item.path("price").asDouble(), item.path("qty").asDouble(), item.path("gst").asDouble());
                labels.put(key, new String[]{partyFirst ? party : item.path("name").asText(), partyFirst ? item.path("name").asText() : party});
            }
        }
        ReportSheet sheet = new ReportSheet(mapper).columns("a|" + (partyFirst ? "Party" : "Item"), "b|" + (partyFirst ? "Item" : "Party"), "qty|Qty|num", "val|Value (ex-GST)|money");
        groups.entrySet().stream().sorted(Comparator.comparingDouble(entry -> -entry.getValue()[1])).forEach(entry -> sheet.row(labels.get(entry.getKey())[0], labels.get(entry.getKey())[1], entry.getValue()[0], ReportService.round(entry.getValue()[1])));
        return sheet.note(groups.isEmpty() ? "No sales in this period." : null).build();
    }

    private ObjectNode movement(ObjectNode state, List<ObjectNode> sales, List<ObjectNode> purchases) {
        Map<String, double[]> sold = new LinkedHashMap<>();
        Map<String, double[]> bought = new LinkedHashMap<>();
        for (ObjectNode sale : sales) {
            for (JsonNode item : sale.withArray("items")) {
                double[] bucket = sold.computeIfAbsent(item.path("productId").asText(), ignored -> new double[2]);
                bucket[0] += item.path("qty").asDouble();
                bucket[1] += ReportService.exclusive(item.path("price").asDouble(), item.path("qty").asDouble(), item.path("gst").asDouble());
            }
        }
        for (ObjectNode purchase : purchases) {
            for (JsonNode item : purchase.withArray("items")) {
                if (item.path("productId").asText("").isEmpty()) {
                    continue;
                }
                double[] bucket = bought.computeIfAbsent(item.path("productId").asText(), ignored -> new double[2]);
                bucket[0] += item.path("qty").asDouble();
                bucket[1] += item.path("ptr").asDouble() * item.path("qty").asDouble();
            }
        }
        ReportSheet sheet = new ReportSheet(mapper).columns("item|Item", "sq|Sold qty|num", "sv|Sold value|money", "pq|Purch qty|num", "pv|Purch value|money", "stock|In stock|num");
        sold.keySet().forEach(id -> bought.putIfAbsent(id, new double[2]));
        bought.keySet().stream().sorted(Comparator.comparingDouble(id -> -(sold.getOrDefault(id, new double[2])[1]))).forEach(id -> {
            ObjectNode product = find(state, id);
            double[] sale = sold.getOrDefault(id, new double[2]);
            double[] purchase = bought.getOrDefault(id, new double[2]);
            sheet.row(product == null ? id : product.path("name").asText(), sale[0], ReportService.round(sale[1]), purchase[0], ReportService.round(purchase[1]), product == null ? 0 : ReportService.stock(product));
        });
        return sheet.note(bought.isEmpty() ? "No item movement in this period." : null).build();
    }

    private ObjectNode low(ObjectNode state) {
        ReportSheet sheet = new ReportSheet(mapper).columns("item|Item", "cat|Category", "stock|In stock|num", "reorder|Reorder level|num", "rack|Rack", "status|Status");
        int count = 0;
        for (JsonNode node : state.withArray("inventory")) {
            if (node instanceof ObjectNode product && ReportService.stock(product) <= product.path("reorderLevel").asDouble()) {
                sheet.row(product.path("name").asText(), ReportService.category(product.path("category").asText()), ReportService.stock(product), product.path("reorderLevel").asDouble(), product.path("rack").asText(), ReportService.stock(product) <= 0 ? "Out of stock" : "Low");
                count++;
            }
        }
        return sheet.note(count == 0 ? "No items at or below reorder level — stock is healthy." : null).build();
    }

    private ObjectNode rates(ObjectNode state) {
        ReportSheet sheet = new ReportSheet(mapper).columns("item|Item", "pack|Pack", "gst|GST", "mrp|MRP|money", "sale|Sale price|money", "rack|Rack");
        for (JsonNode node : state.withArray("inventory")) {
            if (node instanceof ObjectNode product) {
                sheet.row(product.path("name").asText(), product.path("pack").asText(), product.path("gst").asText() + "%", ReportService.round(ReportService.mrp(product)), ReportService.round(ReportService.sell(product)), product.path("rack").asText());
            }
        }
        return sheet.build();
    }

    private ObjectNode detail(ObjectNode state, long now) {
        ReportSheet sheet = new ReportSheet(mapper).columns("item|Item", "batch|Batch", "exp|Expiry", "left|To expiry", "qty|Qty|num", "mrp|MRP|money", "ptr|PTR|money", "val|Value|money");
        for (JsonNode node : state.withArray("inventory")) {
            if (!(node instanceof ObjectNode product)) {
                continue;
            }
            for (JsonNode batch : product.withArray("batches")) {
                int months = months(batch.path("expiry").asText(), now);
                sheet.row(product.path("name").asText(), batch.path("batchNo").asText(), batch.path("expiry").asText(), months < 0 ? "Expired" : months + "mo", batch.path("qty").asDouble(), ReportService.round(batch.path("mrp").asDouble()), ReportService.round(batch.path("ptr").asDouble()), ReportService.round(batch.path("qty").asDouble() * batch.path("ptr").asDouble()));
            }
        }
        return sheet.build();
    }

    private ObjectNode summary(ObjectNode state, long now) {
        ReportSheet sheet = new ReportSheet(mapper).columns("item|Item", "cat|Category", "stock|In stock|num", "loose|Loose|num", "mrp|MRP|money", "val|Stock value|money", "status|Status");
        for (JsonNode node : state.withArray("inventory")) {
            if (!(node instanceof ObjectNode product)) {
                continue;
            }
            String status = ReportService.stock(product) <= 0 && product.path("looseUnits").asDouble() <= 0 ? "Out"
                    : ReportService.stock(product) <= product.path("reorderLevel").asDouble() ? "Low"
                    : months(product.withArray("batches").isEmpty() ? "2999-12" : product.withArray("batches").get(0).path("expiry").asText("2999-12"), now) < 0 ? "Expired" : "OK";
            sheet.row(product.path("name").asText(), ReportService.category(product.path("category").asText()), ReportService.stock(product), product.path("looseUnits").asDouble(), ReportService.round(ReportService.mrp(product)), ReportService.round(ReportService.stockValue(product)), status);
        }
        return sheet.build();
    }

    private ObjectNode ageing(ObjectNode state, long now) {
        ReportSheet sheet = new ReportSheet(mapper).columns("party|Party", "inv|Invoice", "amt|Outstanding|money", "age|Age (days)|num", "bucket|Bucket");
        for (JsonNode node : state.withArray("sales")) {
            if (!(node instanceof ObjectNode sale) || "cancelled".equals(sale.path("status").asText()) || !ReportService.open(sale)) {
                continue;
            }
            int age = (int) Math.max(0, Math.floor((now - sale.path("createdAt").asLong()) / 86400000d));
            String bucket = age <= 30 ? "0–30" : age <= 60 ? "31–60" : age <= 90 ? "61–90" : "90+";
            sheet.row(sale.path("customer").path("name").asText(), sale.path("id").asText(), ReportService.round(ReportService.totals(sale).payable()), age, bucket);
        }
        return sheet.note(sheet.build().withArray("rows").isEmpty() ? "No outstanding receivables — all dues cleared." : null).build();
    }

    private ObjectNode parties(String id, ObjectNode state, long from, long to, long now) {
        Map<String, double[]> groups = new LinkedHashMap<>();
        Map<String, String[]> labels = new LinkedHashMap<>();
        for (JsonNode node : state.withArray("sales")) {
            if (!(node instanceof ObjectNode sale) || "cancelled".equals(sale.path("status").asText())) {
                continue;
            }
            boolean ranged = sale.path("createdAt").asLong() >= from && sale.path("createdAt").asLong() <= to;
            if (!ranged && !ReportService.open(sale)) {
                continue;
            }
            String phone = sale.path("customer").path("phone").asText("");
            String key = sale.path("customer").path("name").asText() + (phone.isEmpty() ? "" : " · " + phone);
            double[] bucket = groups.computeIfAbsent(key, ignored -> new double[4]);
            double payable = ReportService.totals(sale).payable();
            if (ranged) {
                bucket[0]++;
                bucket[1] += payable;
            }
            if (ReportService.open(sale)) {
                bucket[2] += payable;
                bucket[3] = Math.max(bucket[3], Math.floor((now - sale.path("createdAt").asLong()) / 86400000d));
            }
            labels.put(key, new String[]{sale.path("customer").path("name").asText(), phone.isEmpty() ? "—" : phone});
        }
        if ("party-outstanding".equals(id)) {
            ReportSheet sheet = new ReportSheet(mapper).columns("party|Party", "phone|Phone", "out|Outstanding|money", "oldest|Oldest due (days)|num");
            groups.entrySet().stream().filter(entry -> entry.getValue()[2] > 0).sorted(Comparator.comparingDouble(entry -> -entry.getValue()[2]))
                    .forEach(entry -> sheet.row(labels.get(entry.getKey())[0], labels.get(entry.getKey())[1], ReportService.round(entry.getValue()[2]), entry.getValue()[3]));
            return sheet.note(groups.values().stream().noneMatch(value -> value[2] > 0) ? "No party has outstanding dues." : null).build();
        }
        ReportSheet sheet = new ReportSheet(mapper).columns("party|Party", "phone|Phone", "bills|Bills|num", "billed|Total billed|money", "paid|Received|money", "out|Outstanding|money");
        groups.entrySet().stream().sorted(Comparator.comparingDouble(entry -> -entry.getValue()[1])).forEach(entry -> sheet.row(labels.get(entry.getKey())[0], labels.get(entry.getKey())[1], entry.getValue()[0], ReportService.round(entry.getValue()[1]), ReportService.round(entry.getValue()[1] - entry.getValue()[2]), ReportService.round(entry.getValue()[2])));
        return sheet.note(groups.isEmpty() ? "No party activity in this period." : null).build();
    }

    private ObjectNode categories(ObjectNode state, List<ObjectNode> sales) {
        Map<String, double[]> groups = new LinkedHashMap<>();
        for (ObjectNode sale : sales) {
            for (JsonNode item : sale.withArray("items")) {
                String label = ReportService.category(categoryOf(state, item.path("productId").asText()));
                double taxable = ReportService.exclusive(item.path("price").asDouble(), item.path("qty").asDouble(), item.path("gst").asDouble());
                double[] bucket = groups.computeIfAbsent(label, ignored -> new double[3]);
                bucket[0] += item.path("qty").asDouble();
                bucket[1] += taxable;
                bucket[2] += item.path("price").asDouble() * item.path("qty").asDouble() - taxable;
            }
        }
        ReportSheet sheet = new ReportSheet(mapper).columns("cat|Category", "qty|Qty|num", "taxable|Taxable|money", "tax|GST|money", "total|Total|money");
        groups.entrySet().stream().sorted(Comparator.comparingDouble(entry -> -entry.getValue()[1])).forEach(entry -> sheet.row(entry.getKey(), entry.getValue()[0], ReportService.round(entry.getValue()[1]), ReportService.round(entry.getValue()[2]), ReportService.round(entry.getValue()[1] + entry.getValue()[2])));
        return sheet.note(groups.isEmpty() ? "No sales in this period." : null).build();
    }

    private ObjectNode balance(ObjectNode state, List<ObjectNode> sales, List<ObjectNode> purchases, List<ObjectNode> expenses) {
        double stock = 0, collected = 0, receivables = 0, output = 0, input = 0, spent = 0;
        for (JsonNode node : state.withArray("inventory")) {
            if (node instanceof ObjectNode product) {
                stock += ReportService.stockValue(product);
            }
        }
        for (ObjectNode expense : expenses) {
            spent += expense.path("amount").asDouble();
        }
        for (ObjectNode sale : sales) {
            output += ReportService.totals(sale).totalTax();
            if (!ReportService.open(sale)) {
                collected += ReportService.totals(sale).payable();
            }
        }
        collected -= spent;
        for (JsonNode node : state.withArray("sales")) {
            if (node instanceof ObjectNode sale && !"cancelled".equals(sale.path("status").asText()) && ReportService.open(sale)) {
                receivables += ReportService.totals(sale).payable();
            }
        }
        for (ObjectNode purchase : purchases) {
            for (JsonNode item : purchase.withArray("items")) {
                input += item.path("ptr").asDouble() * item.path("qty").asDouble() * item.path("gst").asDouble() / 100;
            }
        }
        double gst = Math.max(0, output - input);
        double assets = stock + collected + receivables;
        return new ReportSheet(mapper).columns("p|Particulars", "amt|Amount|money")
                .row("ASSETS", "").row("  Closing stock (at cost)", ReportService.round(stock)).row("  Cash & bank (collected)", ReportService.round(collected))
                .row("  Sundry debtors (receivable)", ReportService.round(receivables)).row("  Total assets", ReportService.round(assets))
                .row("LIABILITIES", "").row("  GST payable (net)", ReportService.round(gst)).row("  Total liabilities", ReportService.round(gst))
                .totals("Owner's equity (net worth)", ReportService.round(assets - gst))
                .note("Indicative balance sheet from in-app data (stock, collections, receivables & GST).").build();
    }

    private ObjectNode pnl(ObjectNode state, List<ObjectNode> sales, List<ObjectNode> expenses) {
        double taxable = 0, cogs = 0, spent = 0;
        for (ObjectNode sale : sales) {
            taxable += ReportService.totals(sale).taxable();
            for (JsonNode item : sale.withArray("items")) {
                cogs += ReportService.cost(state, item.path("productId").asText()) * item.path("qty").asDouble();
            }
        }
        for (ObjectNode expense : expenses) {
            spent += expense.path("amount").asDouble();
        }
        return new ReportSheet(mapper).columns("p|Particulars", "amt|Amount|money")
                .row("Taxable sales", ReportService.round(taxable)).row("COGS (at purchase cost)", ReportService.round(cogs))
                .row("Gross profit", ReportService.round(taxable - cogs)).row("Expenses", ReportService.round(spent))
                .row("Net profit", ReportService.round(taxable - cogs - spent))
                .note("Income, COGS and gross profit for this period. COGS uses the current batch PTR.").build();
    }

    private ObjectNode salesSummary(List<ObjectNode> sales) {
        double revenue = 0, online = 0, units = 0;
        for (ObjectNode sale : sales) {
            double payable = ReportService.totals(sale).payable();
            revenue += payable;
            if ("online".equals(sale.path("channel").asText())) {
                online += payable;
            }
            for (JsonNode item : sale.withArray("items")) {
                units += item.path("qty").asDouble();
            }
        }
        return new ReportSheet(mapper).columns("p|Particulars", "amt|Amount|money")
                .row("Counter sales", ReportService.round(revenue - online)).row("Online sales", ReportService.round(online))
                .row("Total sales", ReportService.round(revenue)).row("Average bill", sales.isEmpty() ? 0 : ReportService.round(revenue / sales.size()))
                .note(sales.size() + " bills · " + units + " units").build();
    }

    private static ObjectNode find(ObjectNode state, String id) {
        for (JsonNode node : state.withArray("inventory")) {
            if (id.equals(node.path("id").asText()) && node instanceof ObjectNode product) {
                return product;
            }
        }
        return null;
    }

    private static String categoryOf(ObjectNode state, String productId) {
        ObjectNode product = find(state, productId);
        return product == null ? "—" : product.path("category").asText("—");
    }

    private static int months(String expiry, long now) {
        String[] parts = expiry.split("-");
        if (parts.length < 2) {
            return 0;
        }
        var date = Instant.ofEpochMilli(now).atZone(ZoneId.systemDefault());
        return (Integer.parseInt(parts[0]) - date.getYear()) * 12 + (Integer.parseInt(parts[1]) - date.getMonthValue());
    }
}
