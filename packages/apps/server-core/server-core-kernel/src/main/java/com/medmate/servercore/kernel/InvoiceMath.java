package com.medmate.servercore.kernel;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import java.util.Map;
import java.util.TreeMap;

public final class InvoiceMath {
    private InvoiceMath() {
    }

    public static double payable(ArrayNode items, double discount) {
        return totals(items, discount).payable();
    }

    public static Totals totals(ArrayNode items, double discount) {
        double gross = 0;
        double mrpTotal = 0;
        if (items != null) {
            for (JsonNode item : items) {
                gross += item.path("price").asDouble() * item.path("qty").asDouble();
                mrpTotal += item.path("mrp").asDouble() * item.path("qty").asDouble();
            }
        }
        double discountApplied = Math.min(discount, gross);
        double net = gross - discountApplied;
        double keptShare = gross > 0 ? net / gross : 1;
        Map<Double, Double> inclusiveByRate = new TreeMap<>();
        if (items != null) {
            for (JsonNode item : items) {
                double line = item.path("price").asDouble() * item.path("qty").asDouble() * keptShare;
                inclusiveByRate.merge(item.path("gst").asDouble(), line, Double::sum);
            }
        }
        double taxable = 0;
        double totalTax = 0;
        for (var entry : inclusiveByRate.entrySet()) {
            double inclusive = entry.getValue();
            double tax = inclusive - inclusive / (1 + entry.getKey() / 100.0);
            taxable += inclusive - tax;
            totalTax += tax;
        }
        return new Totals(gross, discountApplied, net, taxable, totalTax, Math.round(net), mrpTotal - gross + discountApplied);
    }

    public record Totals(double gross, double discount, double net, double taxable, double totalTax, double payable, double savings) {
    }
}
