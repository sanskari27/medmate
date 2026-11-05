package com.medmate.servercore.pharmacy.sales;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.InvoiceMath;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class InvoicePdf {
    private InvoicePdf() {
    }

    public static byte[] build(ObjectNode sale, ObjectNode profile) {
        InvoiceMath.Totals totals = InvoiceMath.totals((ArrayNode) sale.get("items"), sale.path("discount").asDouble());
        String when = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a", Locale.ENGLISH)
                .format(Instant.ofEpochMilli(sale.path("createdAt").asLong()).atZone(ZoneId.systemDefault()));
        List<String> ops = new ArrayList<>();
        int[] y = {802};
        line(ops, y, profile.path("name").asText(), 16, 40, 15);
        line(ops, y, profile.path("address").asText(), 9, 40, 15);
        line(ops, y, "Ph: " + profile.path("phone").asText() + "   " + profile.path("email").asText(), 9, 40, 15);
        line(ops, y, "GSTIN: " + profile.path("gstin").asText() + "    D.L.: " + profile.path("dlNo").asText(), 9, 40, 15);
        rule(ops, y);
        line(ops, y, "TAX INVOICE   " + sale.path("id").asText(), 12, 40, 15);
        line(ops, y, "Date: " + when + "    " + ("online".equals(sale.path("channel").asText()) ? "Online" : "Counter") + " sale", 9, 40, 15);
        String phone = sale.path("customer").path("phone").asText("");
        String ward = sale.path("ward").asText("");
        line(ops, y, "Billed to: " + sale.path("customer").path("name").asText() + (ward.isEmpty() ? "" : " - " + ward) + (phone.isEmpty() ? "" : "   " + phone), 9, 40, 15);
        boolean pending = sale.has("paid") && sale.get("paid").isBoolean() && !sale.get("paid").asBoolean();
        line(ops, y, "Payment: " + (pending ? "PENDING - pay at reception" : SalesService.label(sale.path("payMode").asText())), 9, 40, 15);
        if (pending) {
            line(ops, y, "** PAYMENT PENDING - COLLECT AT RECEPTION / BILLING COUNTER **", 9, 40, 15);
        }
        rule(ops, y);
        line(ops, y, pad("#", 3) + pad("Item", 30) + padLeft("Qty", 5) + padLeft("Rate", 11) + padLeft("GST", 6) + padLeft("Amount", 12), 9, 40, 15);
        rule(ops, y);
        int index = 1;
        for (JsonNode item : sale.withArray("items")) {
            line(ops, y, pad(String.valueOf(index++), 3) + pad(item.path("name").asText(), 30) + padLeft(String.valueOf(item.path("qty").asDouble()), 5)
                    + padLeft(rupees(item.path("price").asDouble()), 11) + padLeft(item.path("gst").asText() + "%", 6)
                    + padLeft(rupees(item.path("price").asDouble() * item.path("qty").asDouble()), 12), 9, 40, 15);
            String batch = item.path("batchNo").asText("");
            if (!batch.isEmpty() && !"-".equals(batch)) {
                line(ops, y, "   Batch " + batch + "  Exp " + item.path("expiry").asText() + "  HSN " + item.path("hsn").asText(), 7.5, 40, 13);
            }
        }
        rule(ops, y);
        y[0] -= 2;
        sum(ops, y, "Gross (incl. GST)", rupees(totals.gross()));
        if (totals.discount() > 0) {
            sum(ops, y, "Discount", "- " + rupees(totals.discount()));
        }
        sum(ops, y, "Taxable value", rupees(totals.taxable()));
        sum(ops, y, "CGST + SGST", rupees(totals.totalTax()));
        line(ops, y, padLeft("AMOUNT PAYABLE", 60) + padLeft(rupees(totals.payable()), 18), 12, 40, 20);
        rule(ops, y);
        if (totals.savings() > 0) {
            line(ops, y, "You saved " + rupees(totals.savings()) + " on MRP.", 8.5, 40, 15);
        }
        line(ops, y, "Goods once sold are not returnable. Subject to local jurisdiction.", 8, 40, 15);
        y[0] -= 10;
        line(ops, y, "For " + profile.path("name").asText(), 9, 40, 15);
        line(ops, y, "Authorised signatory", 8.5, 40, 15);
        line(ops, y, profile.path("pharmacist").asText(), 7.5, 40, 15);
        return assemble(String.join("\n", ops));
    }

    private static void sum(List<String> ops, int[] y, String label, String value) {
        line(ops, y, padLeft(label, 60) + padLeft(value, 18), 9.5, 40, 14);
    }

    private static void line(List<String> ops, int[] y, String text, double size, int x, int dy) {
        ops.add("BT /F1 " + size + " Tf " + x + " " + y[0] + " Td (" + escape(text) + ") Tj ET");
        y[0] -= dy;
    }

    private static void rule(List<String> ops, int[] y) {
        ops.add("40 " + (y[0] + 9) + " m 555 " + (y[0] + 9) + " l S");
        y[0] -= 6;
    }

    private static String escape(String value) {
        return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").replaceAll("[^\\x20-\\x7e]", "?");
    }

    private static String rupees(double value) {
        return "Rs " + Math.round(value);
    }

    private static String pad(String value, int width) {
        String text = value.length() > width ? value.substring(0, width - 1) + "." : value;
        return String.format("%-" + width + "s", text);
    }

    private static String padLeft(String value, int width) {
        String text = value.length() > width ? value.substring(0, width) : value;
        return String.format("%" + width + "s", text);
    }

    private static byte[] assemble(String content) {
        String[] objects = {
                "<< /Type /Catalog /Pages 2 0 R >>",
                "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
                "<< /Length " + content.length() + " >>\nstream\n" + content + "\nendstream",
                "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>"
        };
        StringBuilder pdf = new StringBuilder("%PDF-1.4\n");
        int[] offsets = new int[objects.length];
        for (int index = 0; index < objects.length; index++) {
            offsets[index] = pdf.length();
            pdf.append(index + 1).append(" 0 obj\n").append(objects[index]).append("\nendobj\n");
        }
        int xref = pdf.length();
        pdf.append("xref\n0 ").append(objects.length + 1).append("\n0000000000 65535 f \n");
        for (int offset : offsets) {
            pdf.append(String.format("%010d 00000 n \n", offset));
        }
        pdf.append("trailer\n<< /Size ").append(objects.length + 1).append(" /Root 1 0 R >>\nstartxref\n").append(xref).append("\n%%EOF");
        return pdf.toString().getBytes(java.nio.charset.StandardCharsets.ISO_8859_1);
    }
}
