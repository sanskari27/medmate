package com.medmate.server.billing.web;

import java.time.Instant;
import java.util.List;

public final class SaleViews {

    private SaleViews() {}

    public record Row(
            String id,
            String type,
            String invoiceNumber,
            String patientName,
            String patientPhone,
            String payMode,
            Instant recordedAt,
            int items,
            String amount) {}

    public record Stats(
            String salesThisMonth, int saleCount, String returnsThisMonth, int returnCount, String netThisMonth) {}

    public record ListResponse(List<Row> sales, Stats stats, int page, int size, int total) {}

    public record LineView(
            int position,
            String productId,
            String name,
            String composition,
            String batchNo,
            String expiry,
            int qty,
            Integer returnedQty,
            String mrp,
            String unitPrice,
            Integer gst,
            String amount) {}

    public record DocumentView(
            String type,
            String id,
            String invoiceNumber,
            String patientName,
            String patientPhone,
            String prescribedBy,
            String prescriptionNumber,
            String payMode,
            Instant recordedAt,
            String subtotal,
            String discount,
            String payable,
            String extraType,
            String extraValue,
            String extraAmount,
            String amount,
            List<LineView> lines) {}

    public record OneResponse(DocumentView sale) {}
}
