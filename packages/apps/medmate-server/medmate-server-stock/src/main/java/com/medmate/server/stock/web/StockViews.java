package com.medmate.server.stock.web;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class StockViews {

    private StockViews() {}

    public record LineView(
            int position,
            String productId,
            String name,
            String batchNo,
            String expiry,
            int qty,
            int freeQty,
            String rate,
            String mrp,
            int gst,
            String amount,
            int returnedQty,
            int returnedFree,
            int onHand) {}

    public record DocumentView(
            String id,
            String type,
            String purchaseId,
            String distributorId,
            String distributorName,
            String invoiceNo,
            LocalDate invoiceDate,
            Instant recordedAt,
            String taxable,
            String gst,
            String total,
            int ledgerAmount,
            int units,
            List<LineView> lines) {}

    public record StatsView(
            int purchasesThisMonth, int purchaseCount, int outstanding, int returnsThisMonth, int returnCount) {}

    public record PurchaseList(List<DocumentView> purchases, StatsView stats) {}

    public record PurchaseOne(DocumentView purchase) {}

    public record BatchView(String batchNo, String expiry, int qty, String rate, String mrp) {}

    public record ProductView(
            String productId,
            String name,
            String marketer,
            String composition,
            String form,
            String pack,
            String type,
            int reorderLevel,
            String rack,
            String rackAlt,
            List<BatchView> batches) {}

    public record InventoryList(List<ProductView> products) {}

    public record RackList(List<String> racks, List<ProductView> products) {}

    public record InventoryOne(ProductView product) {}

    public record MedicineView(String productId, String name, String marketer, String pack, BigDecimal mrp) {}

    public record SearchResponse(List<MedicineView> medicines) {}

    public record SnapshotView(
            String productId,
            String name,
            String marketer,
            String composition,
            String form,
            String pack,
            String type,
            BigDecimal mrp) {}

    public record ValidateResponse(List<SnapshotView> products, List<String> missing, List<String> ambiguous) {}
}
