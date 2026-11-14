package com.medmate.server.oversight;

import static org.assertj.core.api.Assertions.assertThat;

import com.medmate.server.dashboard.DashboardRules;
import com.medmate.server.oversight.store.InsightStore;
import com.medmate.server.reports.ReportBooks;
import com.medmate.server.reports.ReportRules;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class InsightRulesTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 14);

    @Test
    void anEmptyPharmacyStillHasTheBuckets() {
        DashboardRules.Parsed range = DashboardRules.parse("30d", TODAY);
        ReportBooks books = ReportBooks.empty();
        DashboardRules.Snapshot snapshot = DashboardRules.build(books, range, TODAY);
        InsightViews.One one = InsightRules.one(
                snapshot,
                books,
                ReportRules.run("sales-summary", books, range.from(), range.to(), TODAY),
                ReportRules.run("pnl", books, range.from(), range.to(), TODAY),
                ReportRules.run(
                        "pnl", books, TODAY.withDayOfMonth(1), TODAY.withDayOfMonth(TODAY.lengthOfMonth()), TODAY),
                ReportRules.run("gstr3b", books, range.from(), range.to(), TODAY),
                ReportRules.run("receivable-ageing", books, range.from(), range.to(), TODAY),
                InsightStore.Activity.empty(),
                TODAY);
        assertThat(one.range()).isEqualTo("30d");
        assertThat(one.commercial().today().netSales()).isEqualTo("0.00");
        assertThat(one.commercial().today().bills()).isZero();
        assertThat(one.commercial().window().returnCount()).isZero();
        assertThat(one.commercial().window().returnRate()).isEqualTo("0.00");
        assertThat(one.commercial().window().netProfit()).isEqualTo("0.00");
        assertThat(one.commercial().window().dues().buckets())
                .extracting(InsightViews.AgeBucket::bucket)
                .containsExactly("0–30", "31–60", "61–90", "90+");
        assertThat(one.commercial().window().gst().position()).isEqualTo("payable");
        assertThat(one.stock().products()).isZero();
        assertThat(one.stock().prescriptionShare()).isEqualTo("0.00");
        assertThat(one.people().crm().reminders()).hasSize(4);
    }

    @Test
    void distributorOutstandingUsesOpeningPurchasesPaymentsAndReturns() {
        ReportBooks books = new ReportBooks(
                List.of(),
                List.of(),
                List.of(new ReportBooks.Purchase("PUR-001", "Supplier", "INV", Instant.EPOCH, TODAY, 40, List.of())),
                List.of(new ReportBooks.PurchaseReturn("RET-001", "PUR-001", Instant.EPOCH, TODAY, 5, List.of())),
                List.of(),
                List.of(),
                List.of(new ReportBooks.Payment(
                        "TXN-001", "Supplier", Instant.EPOCH, TODAY, new BigDecimal("10.00"), "cash")),
                List.of(),
                List.of());
        assertThat(InsightRules.distributorOutstanding(100, books)).isEqualTo("125.00");
    }

    @Test
    void anApprovedPharmacyWithNoSaleAfterApprovalIsDormant() {
        Instant approved = Instant.parse("2026-11-10T00:00:00Z");
        assertThat(InsightRules.dormant(profile("approved", approved, null))).isTrue();
        assertThat(InsightRules.dormant(profile("approved", approved, approved.minusSeconds(60))))
                .isTrue();
        assertThat(InsightRules.dormant(profile("approved", approved, approved)))
                .isFalse();
        assertThat(InsightRules.dormant(profile("pending_admin", approved, null)))
                .isFalse();
    }

    @Test
    void medianAndCountsIgnoreBlanks() {
        assertThat(InsightRules.median(List.of(), 1)).isNull();
        assertThat(InsightRules.median(List.of(1.0, 3.0), 1)).isEqualTo("2.0");
        assertThat(InsightRules.counts(List.of("Bengaluru", " ", "Bengaluru")))
                .containsExactly(new InsightViews.Count("Bengaluru", 2), new InsightViews.Count("—", 1));
    }

    @Test
    void expiredAndSoonBatchesAreValuedApart() {
        ReportBooks books = new ReportBooks(
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of(new ReportBooks.Product(
                        "med-a",
                        "Crocin",
                        "10s",
                        "Tablet",
                        5,
                        "A1",
                        List.of(
                                new ReportBooks.Batch(
                                        "B1", "2026-11", 2, new BigDecimal("10.00"), new BigDecimal("30.00"), 12),
                                new ReportBooks.Batch(
                                        "B2", "", 3, new BigDecimal("4.00"), new BigDecimal("8.00"), 0)))),
                List.of());
        DashboardRules.Parsed range = DashboardRules.parse("7d", TODAY);
        InsightViews.One one = InsightRules.one(
                DashboardRules.build(books, range, TODAY),
                books,
                ReportRules.run("sales-summary", books, range.from(), range.to(), TODAY),
                ReportRules.run("pnl", books, range.from(), range.to(), TODAY),
                ReportRules.run("pnl", books, TODAY.withDayOfMonth(1), TODAY, TODAY),
                ReportRules.run("gstr3b", books, range.from(), range.to(), TODAY),
                ReportRules.run("receivable-ageing", books, range.from(), range.to(), TODAY),
                new InsightStore.Activity(
                        0, 1, 1, 1, 0, List.of(), 0, 0, 0, 0, 0, 0, 0, 0, List.of(), 0, 0, 0, null, null, 2, 1, 4,
                        List.of()),
                TODAY);
        assertThat(one.stock().expiredQty()).isEqualTo(3);
        assertThat(one.stock().expiredValue()).isEqualTo("12.00");
        assertThat(one.stock().expiring()).isEqualTo(1);
        assertThat(one.stock().expiringValue()).isEqualTo("20.00");
        assertThat(one.stock().prescriptionShare()).isEqualTo("100.00");
        assertThat(one.people().offers().percent()).isEqualTo(2);
        assertThat(one.people().offers().stampedLines()).isEqualTo(4);
    }

    private static InsightStore.Profile profile(String status, Instant approved, Instant sale) {
        return new InsightStore.Profile(
                UUID.randomUUID(),
                "Care",
                "919800000000",
                status,
                "pharmacy",
                "Bengaluru",
                "Karnataka",
                "Pharmacy & Healthcare",
                "Proprietorship",
                List.of("Retail Pharmacy"),
                true,
                false,
                false,
                true,
                true,
                Instant.parse("2026-11-01T00:00:00Z"),
                Instant.parse("2026-11-02T00:00:00Z"),
                approved,
                approved,
                sale,
                false);
    }
}
