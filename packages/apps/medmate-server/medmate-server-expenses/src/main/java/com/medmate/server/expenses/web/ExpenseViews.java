package com.medmate.server.expenses.web;

import java.util.List;

public final class ExpenseViews {

    private ExpenseViews() {}

    public record ExpenseView(
            String number,
            String spentOn,
            String party,
            String category,
            String paymentMode,
            String amount,
            int gst,
            String note) {}

    public record SummaryView(int count, String total, String gst) {}

    public record ListResponse(
            List<ExpenseView> expenses, SummaryView summary, List<String> categories, int page, int size, int total) {}

    public record ExportResponse(List<ExpenseView> expenses) {}

    public record OneResponse(ExpenseView expense) {}
}
