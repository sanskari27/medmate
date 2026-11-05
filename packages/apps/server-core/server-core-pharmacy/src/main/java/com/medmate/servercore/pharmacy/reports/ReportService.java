package com.medmate.servercore.pharmacy.reports;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.InvoiceMath;
import com.medmate.servercore.kernel.StockMath;
import com.medmate.servercore.pharmacy.sales.SalesService;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ReportService {
    private static final String CATALOG = """
            [{"id":"balance-sheet","name":"Balance Sheet","cat":"favourite","fav":true,"desc":"Assets vs liabilities snapshot"},
            {"id":"gstr1","name":"GSTR-1 (Sales)","cat":"favourite","fav":true,"desc":"Outward supplies, slab-wise"},
            {"id":"pnl","name":"Profit And Loss Report","cat":"favourite","fav":true,"analytics":"accounts","desc":"Income, COGS & gross profit"},
            {"id":"sales-summary","name":"Sales Summary","cat":"favourite","fav":true,"analytics":"overview","desc":"Sales dashboard & trends"},
            {"id":"gstr2","name":"GSTR-2 (Purchase)","cat":"gst","desc":"Inward supplies, slab-wise"},
            {"id":"gstr3b","name":"GSTR-3b","cat":"gst","desc":"Output vs input — net GST"},
            {"id":"gst-purchase-hsn","name":"GST Purchase (With HSN)","cat":"gst","desc":"Purchases grouped by HSN"},
            {"id":"gst-sales-hsn","name":"GST Sales (With HSN)","cat":"gst","desc":"Sales grouped by HSN"},
            {"id":"hsn-sales-summary","name":"HSN Wise Sales Summary","cat":"gst","desc":"Qty & value by HSN code"},
            {"id":"tds-payable","name":"TDS Payable","cat":"gst","desc":"Tax deducted, payable"},
            {"id":"tds-receivable","name":"TDS Receivable","cat":"gst","desc":"Tax deducted by others"},
            {"id":"tcs-payable","name":"TCS Payable","cat":"gst","desc":"Tax collected at source, payable"},
            {"id":"tcs-receivable","name":"TCS Receivable","cat":"gst","desc":"TCS withheld by Namma MedMate (u/s 52)"},
            {"id":"audit-trail","name":"Audit Trail","cat":"transaction","desc":"Every document, time-stamped"},
            {"id":"bill-wise-profit","name":"Bill Wise Profit","cat":"transaction","desc":"Profit & margin per invoice"},
            {"id":"cash-bank","name":"Cash and Bank Report (All Payments)","cat":"transaction","desc":"Collections by mode"},
            {"id":"daybook","name":"Daybook","cat":"transaction","desc":"Net sales vs purchases per day"},
            {"id":"expense-category","name":"Expense Category Report","cat":"transaction","desc":"Expenses grouped by head"},
            {"id":"expense-transaction","name":"Expense Transaction Report","cat":"transaction","desc":"Every expense entry"},
            {"id":"purchase-summary","name":"Purchase Summary","cat":"transaction","desc":"GRN-wise inward purchases"},
            {"id":"item-by-party","name":"Item Report By Party","cat":"item","desc":"Who bought each item"},
            {"id":"item-sales-purchase","name":"Item Sales and Purchase Summary","cat":"item","desc":"Sold vs purchased per item"},
            {"id":"low-stock","name":"Low Stock Summary","cat":"item","desc":"Items at/under reorder level"},
            {"id":"rate-list","name":"Rate List","cat":"item","desc":"MRP & sale price per item"},
            {"id":"stock-detail","name":"Stock Detail Report","cat":"item","desc":"Batch-wise stock & expiry"},
            {"id":"stock-summary","name":"Stock Summary","cat":"item","desc":"Stock & value per item"},
            {"id":"receivable-ageing","name":"Receivable Ageing Report","cat":"party","desc":"Outstanding by age bucket"},
            {"id":"party-by-item","name":"Party Report By Item","cat":"party","desc":"What each party bought"},
            {"id":"party-ledger","name":"Party Statement (Ledger)","cat":"party","desc":"Billed, paid & outstanding"},
            {"id":"party-outstanding","name":"Party Wise Outstanding","cat":"party","desc":"Dues per party"},
            {"id":"sales-category-wise","name":"Sales Summary - Category Wise","cat":"party","desc":"Sales grouped by category"}]
            """;
    private final ObjectMapper mapper;
    private final ReportMath math;

    public ReportService(ObjectMapper mapper, ReportMath math) {
        this.mapper = mapper;
        this.math = math;
    }

    public ArrayNode catalog() {
        try {
            return (ArrayNode) mapper.readTree(CATALOG);
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    public ObjectNode run(String id, ObjectNode state, long from, long to) {
        return math.run(id, state, from, to, System.currentTimeMillis());
    }

    public String csv(ObjectNode report) {
        StringBuilder text = new StringBuilder("\uFEFF");
        text.append(line(report.get("columns"), true));
        for (JsonNode row : report.withArray("rows")) {
            text.append('\n').append(line(row, false));
        }
        if (report.has("totals")) {
            text.append('\n').append(line(report.get("totals"), false));
        }
        return text.toString();
    }

    private static String line(JsonNode cells, boolean labels) {
        StringBuilder row = new StringBuilder();
        int index = 0;
        for (JsonNode cell : cells) {
            if (index++ > 0) {
                row.append(',');
            }
            String value = labels ? cell.path("label").asText() : cell.isNumber() ? String.valueOf(Math.round(cell.asDouble())) : cell.asText();
            row.append('"').append(value.replace("\"", "\"\"")).append('"');
        }
        return row.toString();
    }

    static String day(long timestamp) {
        return DateTimeFormatter.ofPattern("dd MMM yy", Locale.ENGLISH).format(Instant.ofEpochMilli(timestamp).atZone(ZoneId.systemDefault()));
    }

    static String stamp(long timestamp) {
        return DateTimeFormatter.ofPattern("dd MMM yy, hh:mm a", Locale.ENGLISH).format(Instant.ofEpochMilli(timestamp).atZone(ZoneId.systemDefault()));
    }

    static String pay(String mode) {
        return SalesService.label(mode);
    }

    static String status(String value) {
        return switch (value == null ? "" : value) {
            case "new" -> "New order";
            case "accepted" -> "Accepted";
            case "packed" -> "Packed";
            case "out" -> "Out for delivery";
            case "delivered" -> "Delivered";
            case "completed" -> "Completed";
            case "cancelled" -> "Cancelled";
            default -> value == null ? "" : value;
        };
    }

    static String category(String key) {
        return Map.ofEntries(
                Map.entry("fever", "Fever & Pain"), Map.entry("cold", "Cough & Cold"), Map.entry("diabetes", "Diabetes"),
                Map.entry("heart", "Heart & BP"), Map.entry("stomach", "Stomach"), Map.entry("vitamins", "Vitamins"),
                Map.entry("skin", "Skin Care"), Map.entry("baby", "Baby Care"), Map.entry("devices", "Devices"),
                Map.entry("personal", "Personal"), Map.entry("ayush", "Ayurveda"), Map.entry("firstaid", "First Aid")
        ).getOrDefault(key, key);
    }

    static int round(double value) {
        return (int) Math.round(value);
    }

    static double exclusive(double price, double quantity, double gst) {
        return (price * quantity) / (1 + gst / 100);
    }

    static InvoiceMath.Totals totals(ObjectNode sale) {
        return InvoiceMath.totals((ArrayNode) sale.get("items"), sale.path("discount").asDouble());
    }

    static boolean open(ObjectNode sale) {
        return "online".equals(sale.path("channel").asText()) && "cod".equals(sale.path("payMode").asText())
                && !"delivered".equals(sale.path("status").asText()) && !"cancelled".equals(sale.path("status").asText());
    }

    static double stock(ObjectNode product) {
        double quantity = 0;
        for (JsonNode batch : product.withArray("batches")) {
            quantity += batch.path("qty").asDouble();
        }
        return quantity;
    }

    static double stockValue(ObjectNode product) {
        double value = 0;
        for (JsonNode batch : product.withArray("batches")) {
            value += batch.path("qty").asDouble() * batch.path("ptr").asDouble();
        }
        return value;
    }

    static double mrp(ObjectNode product) {
        return product.withArray("batches").isEmpty() ? 0 : product.withArray("batches").get(0).path("mrp").asDouble();
    }

    static double sell(ObjectNode product) {
        return product.has("onlinePrice") && !product.get("onlinePrice").isNull() ? product.get("onlinePrice").asDouble() : mrp(product);
    }

    static double cost(ObjectNode state, String productId) {
        for (JsonNode node : state.withArray("inventory")) {
            if (productId.equals(node.path("id").asText()) && node instanceof ObjectNode product) {
                ObjectNode earliest = StockMath.earliestBatch(product);
                if (earliest != null) {
                    return earliest.path("ptr").asDouble();
                }
                return product.withArray("batches").isEmpty() ? 0 : product.withArray("batches").get(0).path("ptr").asDouble();
            }
        }
        return 0;
    }
}
