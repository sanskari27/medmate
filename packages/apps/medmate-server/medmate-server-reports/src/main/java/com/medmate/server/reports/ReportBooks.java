package com.medmate.server.reports;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ReportBooks(
        List<Bill> bills,
        List<SaleReturn> saleReturns,
        List<Purchase> purchases,
        List<PurchaseReturn> purchaseReturns,
        List<Expense> expenses,
        List<Repayment> repayments,
        List<Payment> payments,
        List<Product> products,
        List<Offer> offers) {

    public static ReportBooks empty() {
        return new ReportBooks(
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of());
    }

    public record Bill(
            String number,
            String patientName,
            String phone,
            String payMode,
            Instant soldAt,
            LocalDate soldOn,
            BigDecimal extra,
            BigDecimal payable,
            List<BillLine> lines) {}

    public record BillLine(
            int position,
            String productId,
            String name,
            String batchNo,
            int qty,
            int returnedQty,
            BigDecimal unitPrice,
            int gst,
            BigDecimal batchRate) {}

    public record SaleReturn(
            String code, String billNumber, Instant at, LocalDate on, BigDecimal amount, List<SaleReturnLine> lines) {}

    public record SaleReturnLine(int billPosition, int qty, BigDecimal amount) {}

    public record Purchase(
            String code,
            String supplier,
            String invoiceNo,
            Instant at,
            LocalDate on,
            int ledger,
            List<PurchaseLine> lines) {}

    public record PurchaseLine(
            int position, String productId, String name, int qty, BigDecimal rate, BigDecimal mrp, int gst) {}

    public record PurchaseReturn(
            String code, String purchaseCode, Instant at, LocalDate on, int ledger, List<PurchaseReturnLine> lines) {}

    public record PurchaseReturnLine(int position, int qty) {}

    public record Expense(
            String number, LocalDate spentOn, String party, String category, String mode, BigDecimal amount, int gst) {}

    public record Repayment(String code, String phone, Instant at, LocalDate on, BigDecimal amount, String mode) {}

    public record Payment(String code, String party, Instant at, LocalDate on, BigDecimal amount, String mode) {}

    public record Product(
            String id, String name, String pack, String type, int reorder, String rack, List<Batch> batches) {}

    public record Batch(String batchNo, String expiry, int qty, BigDecimal rate, BigDecimal mrp, Integer gst) {}

    public record Offer(String id, String type, BigDecimal value, String scope, String productId) {}
}
