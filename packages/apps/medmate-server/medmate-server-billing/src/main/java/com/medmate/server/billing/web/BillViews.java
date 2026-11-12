package com.medmate.server.billing.web;

import java.time.Instant;
import java.util.List;

public final class BillViews {

    private BillViews() {}

    public record LineView(
            String productId,
            String name,
            String composition,
            String batchNo,
            String expiry,
            int qty,
            String mrp,
            String unitPrice,
            int gst,
            String offerId,
            String offerTitle,
            String discount) {}

    public record BillView(
            String number,
            String patientName,
            String patientPhone,
            String prescribedBy,
            String prescriptionNumber,
            String payMode,
            Instant soldAt,
            String subtotal,
            String discount,
            String payable,
            String extraType,
            String extraValue,
            String extraAmount,
            List<LineView> lines) {}

    public record OneResponse(BillView bill) {}
}
