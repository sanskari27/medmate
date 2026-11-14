package com.medmate.server.oversight;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class InsightViews {

    private InsightViews() {}

    public record Count(String label, int count) {}

    public record Features(
            int pharmacies, int onlineOrders, int kiosk, int eInvoicing, int looseSelling, int lowStockAlerts) {}

    public record Timing(String daysToSubmit, String daysToDecision) {}

    public record Support(int open, String medianResolveHours) {}

    public record DormantPharmacy(UUID pharmacyId, String name, Instant approvedAt) {}

    public record Dormant(int total, List<DormantPharmacy> pharmacies) {}

    public record Rank(UUID pharmacyId, String name, String value) {}

    public record Rankings(
            List<Rank> sales, List<Rank> credit, List<Rank> returns, List<Rank> expiring, List<Rank> tickets) {}

    public record StatusCounts(
            int approved, int blocked, int complianceReview, int finalReview, int incomplete, int rejected) {}

    public record Fleet(
            int total,
            StatusCounts status,
            List<Count> byStatus,
            List<Count> byType,
            List<Count> byCity,
            List<Count> byState,
            List<Count> byIndustry,
            List<Count> byRegistration,
            List<Count> byBusinessType,
            Features features,
            Timing timing,
            Dormant dormant,
            Support support,
            String rankingRange,
            Rankings rankings) {}

    public record Today(
            String netSales,
            int bills,
            String averageBill,
            int units,
            String cash,
            String credit,
            String returns,
            int returnCount) {}

    public record Month(String netSales, String purchases, String expenses, String netProfit) {}

    public record Collected(String cash, String upi, String card) {}

    public record ExpenseBar(String category, String amount) {}

    public record Gst(String outward, String inward, String position, String amount) {}

    public record AgeBucket(String bucket, int bills, String amount) {}

    public record Credit(int bills, String outstanding, List<AgeBucket> buckets) {}

    public record Window(
            String netSales,
            int bills,
            String averageBill,
            int units,
            String cash,
            String creditSales,
            Collected collected,
            String taxable,
            String cogs,
            String gross,
            String margin,
            String expenses,
            String netProfit,
            String returns,
            int returnCount,
            String returnRate,
            List<ExpenseBar> topExpenses,
            Gst gst,
            Credit dues,
            String distributorOutstanding,
            String lastSale,
            String lastPurchase) {}

    public record Commercial(Today today, Month month, Window window) {}

    public record Attention(String name, int onHand, int reorder) {}

    public record Expiring(String name, String batchNo, String expiry, int qty, int months, boolean expired) {}

    public record Stock(
            int products,
            int batches,
            String cost,
            String retail,
            int low,
            int out,
            int expiring,
            int expiredQty,
            String expiredValue,
            String expiringValue,
            String prescriptionShare,
            int racksInUse,
            int emptyRacks,
            List<Attention> attention,
            List<Expiring> expiringSoon) {}

    public record StaffMember(String name, boolean disabled, int permissions) {}

    public record Staff(int count, int disabled, List<StaffMember> members) {}

    public record Employees(int active, int inactive, int fullTime, int partTime, int contract) {}

    public record Patients(int buyers, int repeat, int consented) {}

    public record Reminder(String kind, int count) {}

    public record Crm(
            List<Reminder> reminders, int pointsRedeemed, int campaigns, int reach, String rating, String nps) {}

    public record Offers(int percent, int flat, int stampedLines) {}

    public record People(Staff staff, Employees employees, Patients patients, Crm crm, Offers offers) {}

    public record SupportCase(
            long ticketNumber,
            String category,
            String status,
            String assignee,
            Instant createdAt,
            Instant resolvedAt) {}

    public record One(
            String range,
            String from,
            String to,
            Commercial commercial,
            Stock stock,
            People people,
            List<SupportCase> cases) {}
}
