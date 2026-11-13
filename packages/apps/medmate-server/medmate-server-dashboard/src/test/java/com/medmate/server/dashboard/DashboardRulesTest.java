package com.medmate.server.dashboard;

import static org.assertj.core.api.Assertions.assertThat;

import com.medmate.server.reports.ReportBooks;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class DashboardRulesTest {

    private static final LocalDate TODAY = LocalDate.parse("2026-11-13");

    @Test
    void netSalesStayInTheirMonthUntilTheReturn() {
        DashboardRules.Snapshot november = snapshot("30d", TODAY);
        assertThat(november.today().netSales()).isEqualTo("0.00");
        assertThat(november.today().bills()).isZero();
        assertThat(november.today().averageBill()).isEqualTo("0.00");
        assertThat(november.today().spark()).hasSize(7).allMatch("0.00"::equals);
        assertThat(november.month().netSales()).isEqualTo("354.00");
        assertThat(november.month().purchases()).isEqualTo("112.00");
        assertThat(november.month().expenses()).isEqualTo("118.00");
        assertThat(november.today().returns()).isEqualTo("0.00");
        assertThat(november.today().returnCount()).isZero();
        assertThat(november.window().returns()).isEqualTo("0.00");
        assertThat(november.window().margin()).isEqualTo("53.33");
        assertThat(bucket(november, "2 Nov").cash()).isEqualTo("236.00");
        assertThat(bucket(november, "2 Nov").cashBills()).isEqualTo(1);
        assertThat(bucket(november, "5 Nov").credit()).isEqualTo("118.00");
        assertThat(bucket(november, "5 Nov").creditBills()).isEqualTo(1);
        assertThat(bucket(november, "3 Nov").purchases()).isEqualTo("112.00");
        assertThat(november.window().profit().taxable()).isEqualTo("300.00");
        assertThat(november.window().profit().cogs()).isEqualTo("140.00");
        assertThat(november.window().profit().gross()).isEqualTo("160.00");

        DashboardRules.Snapshot later = snapshot("7d", LocalDate.parse("2026-12-02"));
        assertThat(later.today().netSales()).isEqualTo("-118.00");
        assertThat(later.today().units()).isEqualTo(-1);
        assertThat(later.today().bills()).isZero();
        assertThat(later.today().cash()).isEqualTo("-118.00");
        assertThat(later.month().netSales()).isEqualTo("-118.00");
        assertThat(later.month().purchases()).isEqualTo("0.00");
        assertThat(later.month().expenses()).isEqualTo("0.00");
        assertThat(later.today().returns()).isEqualTo("118.00");
        assertThat(later.today().returnCount()).isEqualTo(1);
        assertThat(later.window().returns()).isEqualTo("118.00");
        assertThat(later.window().margin()).isEqualTo("50.00");
        assertThat(bucket(later, "Wed").cash()).isEqualTo("-118.00");
    }

    @Test
    void collectionsExpensesDuesAndStock() {
        DashboardRules.Snapshot view = snapshot("30d", TODAY);
        assertThat(view.window().collected().cash()).isEqualTo("236.00");
        assertThat(view.window().collected().upi()).isEqualTo("50.00");
        assertThat(view.window().collected().card()).isEqualTo("0.00");
        assertThat(view.window().expenses()).containsExactly(new DashboardRules.ExpenseBar("Rent Expense", "118.00"));
        assertThat(view.window().topSellers()).containsExactly(new DashboardRules.Seller("Crocin", 3, "354.00"));
        assertThat(view.dues()).isEqualTo(new DashboardRules.Dues(2, "186.00"));
        assertThat(view.stock().low()).isEqualTo(2);
        assertThat(view.stock().out()).isEqualTo(1);
        assertThat(view.stock().cost()).isEqualTo("302.00");
        assertThat(view.stock().retail()).isEqualTo("702.00");
        assertThat(view.stock().attention())
                .containsExactly(
                        new DashboardRules.Attention("Crocin", 5, 20), new DashboardRules.Attention("Zinc", 0, 5));
        assertThat(view.stock().expiring()).isEqualTo(1);
        assertThat(view.stock().expiringSoon())
                .containsExactly(new DashboardRules.Expiring("Old", "B9", "2026-10", 2, -1, true));
        assertThat(view.recent()).hasSize(3);
        assertThat(view.recent().get(0).number()).isEqualTo("INV-3");
        assertThat(view.recent().get(0).payMode()).isEqualTo("credit");
    }

    @Test
    void aBlankRangeIsSevenDaysAndABadRangeIsRefused() {
        DashboardRules.Parsed week = DashboardRules.parse(null, TODAY);
        assertThat(week.range()).isEqualTo("7d");
        assertThat(week.buckets()).hasSize(7);
        assertThat(week.from()).isEqualTo(LocalDate.parse("2026-11-07"));
        assertThat(DashboardRules.parse("  ", TODAY).range()).isEqualTo("7d");
        assertThat(DashboardRules.parse("12m", TODAY).buckets()).hasSize(12);
        assertThat(DashboardRules.parse("12m", TODAY).from()).isEqualTo(LocalDate.parse("2025-12-01"));
        assertThat(DashboardRules.parse("year", TODAY).problem()).isEqualTo("The date range is not valid.");
        DashboardRules.Snapshot narrow = snapshot("7d", TODAY);
        assertThat(narrow.window().collected().upi()).isEqualTo("0.00");
        assertThat(narrow.window().expenses()).containsExactly(new DashboardRules.ExpenseBar("Rent Expense", "118.00"));
    }

    private static DashboardRules.Bucket bucket(DashboardRules.Snapshot view, String label) {
        return view.window().buckets().stream()
                .filter(row -> label.equals(row.label()))
                .findFirst()
                .orElseThrow();
    }

    private static DashboardRules.Snapshot snapshot(String range, LocalDate today) {
        DashboardRules.Parsed parsed = DashboardRules.parse(range, today);
        assertThat(parsed.problem()).isNull();
        return DashboardRules.build(books(), parsed, today);
    }

    private static ReportBooks books() {
        return new ReportBooks(
                List.of(
                        bill("INV-1", "Ada", "9886012345", "cash", "2026-11-02", "236.00", 2, "118.00", 18, "50.00"),
                        bill(
                                "INV-2",
                                "Beena",
                                "9886011111",
                                "credit",
                                "2026-10-01",
                                "118.00",
                                1,
                                "118.00",
                                18,
                                "40.00"),
                        bill(
                                "INV-3",
                                "Beena",
                                "9886011111",
                                "credit",
                                "2026-11-05",
                                "118.00",
                                1,
                                "118.00",
                                18,
                                "40.00")),
                List.of(new ReportBooks.SaleReturn(
                        "RET-1",
                        "INV-1",
                        at("2026-12-02"),
                        LocalDate.parse("2026-12-02"),
                        new BigDecimal("118.00"),
                        List.of(new ReportBooks.SaleReturnLine(0, 1, new BigDecimal("118.00"))))),
                List.of(new ReportBooks.Purchase(
                        "PUR-001",
                        "Bengaluru",
                        "INV-9",
                        at("2026-11-03"),
                        LocalDate.parse("2026-11-03"),
                        112,
                        List.of(new ReportBooks.PurchaseLine(
                                0, "med-a", "Crocin", 10, new BigDecimal("10.00"), new BigDecimal("30.00"), 12)))),
                List.of(),
                List.of(new ReportBooks.Expense(
                        "EXP-1001",
                        LocalDate.parse("2026-11-10"),
                        "Landlord",
                        "Rent Expense",
                        "cash",
                        new BigDecimal("118.00"),
                        18)),
                List.of(new ReportBooks.Repayment(
                        "CR-001",
                        "9886011111",
                        at("2026-11-06"),
                        LocalDate.parse("2026-11-06"),
                        new BigDecimal("50.00"),
                        "upi")),
                List.of(),
                List.of(
                        product("med-a", "Crocin", 20, batch("B1", "2027-06", 5, "50.00", "118.00")),
                        product("zinc", "Zinc", 5),
                        product("old", "Old", 1, batch("B9", "2026-10", 2, "10.00", "20.00")),
                        product("ok", "Ok", 1, batch("B2", "2028-01", 8, "4.00", "9.00"))),
                List.of());
    }

    private static ReportBooks.Bill bill(
            String number,
            String name,
            String phone,
            String payMode,
            String day,
            String payable,
            int qty,
            String price,
            int gst,
            String rate) {
        return new ReportBooks.Bill(
                number,
                name,
                phone,
                payMode,
                at(day),
                LocalDate.parse(day),
                BigDecimal.ZERO,
                new BigDecimal(payable),
                List.of(new ReportBooks.BillLine(
                        0, "med-a", "Crocin", "B1", qty, 0, new BigDecimal(price), gst, new BigDecimal(rate))));
    }

    private static ReportBooks.Product product(String id, String name, int reorder, ReportBooks.Batch... batches) {
        return new ReportBooks.Product(id, name, null, null, reorder, null, List.of(batches));
    }

    private static ReportBooks.Batch batch(String batchNo, String expiry, int qty, String rate, String mrp) {
        return new ReportBooks.Batch(batchNo, expiry, qty, new BigDecimal(rate), new BigDecimal(mrp), 0);
    }

    private static Instant at(String day) {
        return LocalDate.parse(day).atStartOfDay(DashboardRules.ZONE).toInstant();
    }
}
