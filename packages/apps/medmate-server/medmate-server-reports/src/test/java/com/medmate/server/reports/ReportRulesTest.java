package com.medmate.server.reports;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class ReportRulesTest {

    private static final LocalDate TODAY = LocalDate.parse("2026-11-13");
    private static final LocalDate FROM = LocalDate.parse("2026-11-01");
    private static final LocalDate TO = LocalDate.parse("2026-11-30");

    @Test
    void slabGstReturnAndNetGst() {
        ReportRules.Result november = report("gstr1", FROM, TO);
        assertThat(november.rows()).containsExactly(List.of("18%", 3, "300.00", "27.00", "27.00", "54.00", "354.00"));
        ReportRules.Result december = report("gstr1", LocalDate.parse("2026-12-01"), LocalDate.parse("2026-12-31"));
        assertThat(december.rows())
                .containsExactly(List.of("18%", -1, "-100.00", "-9.00", "-9.00", "-18.00", "-118.00"));

        ReportRules.Result inward = report("gstr2", FROM, TO);
        assertThat(inward.rows()).containsExactly(List.of("12%", 10, "100.00", "6.00", "6.00", "12.00", "112.00"));
        ReportRules.Result inwardLater = report("gstr2", LocalDate.parse("2026-12-01"), LocalDate.parse("2026-12-31"));
        assertThat(inwardLater.rows())
                .containsExactly(List.of("12%", -4, "-40.00", "-2.40", "-2.40", "-4.80", "-44.80"));

        ReportRules.Result net = report("gstr3b", FROM, TO);
        assertThat(net.rows().get(0)).containsExactly("3.1 Outward taxable supplies", "300.00", "54.00");
        assertThat(net.rows().get(1)).containsExactly("4. Eligible ITC (inward)", "100.00", "12.00");
        assertThat(net.totals()).containsExactly("Net GST payable", "", "42.00");
    }

    @Test
    void profitCollectionsDaybookAndExpenses() {
        ReportRules.Result profit = report("bill-wise-profit", FROM, TO);
        assertThat(profit.rows())
                .containsExactly(
                        List.of("INV-1", "02 Nov 2026", "Ada", "100.00", "50.00", "50.00", "50%"),
                        List.of("INV-3", "05 Nov 2026", "Beena", "100.00", "40.00", "60.00", "60%"));

        ReportRules.Result pnl = report("pnl", FROM, TO);
        assertThat(pnl.rows())
                .containsExactly(
                        List.of("Taxable sales", "300.00"),
                        List.of("COGS", "140.00"),
                        List.of("Gross profit", "160.00"),
                        List.of("Expenses", "118.00"),
                        List.of("Net profit", "42.00"));
        assertThat(pnl.note()).isEqualTo("COGS uses the sold batch rate.");

        ReportRules.Result cash = report("cash-bank", FROM, TO);
        assertThat(cash.rows())
                .containsExactly(
                        List.of("Cash sales", "Cash", 1, "236.00"),
                        List.of("Cash repayments", "Cash", 0, "0.00"),
                        List.of("UPI", "Bank", 1, "50.00"),
                        List.of("Card", "Bank", 0, "0.00"));

        ReportRules.Result daybook = report("daybook", FROM, TO);
        assertThat(daybook.rows())
                .containsExactly(
                        List.of("02 Nov 26", "236.00", "0.00", "236.00"),
                        List.of("03 Nov 26", "0.00", "112.00", "-112.00"),
                        List.of("05 Nov 26", "118.00", "0.00", "118.00"));

        assertThat(report("expense-category", FROM, TO).rows())
                .containsExactly(List.of("Rent Expense", 1, "100.00", "18.00", "118.00"));
        assertThat(report("expense-transaction", FROM, TO).rows())
                .containsExactly(List.of("EXP-1001", "10 Nov 2026", "Landlord", "Rent Expense", "Cash", "118.00"));
        assertThat(report("sales-summary", FROM, TO).note()).isEqualTo("2 bills · 3 units");
    }

    @Test
    void fifoAgeingAndStockSnapshots() {
        ReportRules.Result ageing = report("receivable-ageing", FROM, TO);
        assertThat(ageing.label()).isEqualTo("As of today");
        assertThat(ageing.rows())
                .containsExactly(
                        List.of("Beena", "INV-2", "68.00", 43, "31–60"),
                        List.of("Beena", "INV-3", "118.00", 8, "0–30"));
        assertThat(report("party-outstanding", FROM, TO).rows())
                .containsExactly(List.of("Beena", "9886011111", "186.00", 43));

        assertThat(report("low-stock", FROM, TO).rows())
                .containsExactly(
                        List.of("Crocin", "Tablet", 5, 20, "A1", "Low"),
                        List.of("Zinc", "—", 0, 5, "—", "Out of stock"));
        assertThat(report("rate-list", FROM, TO).rows().get(0))
                .containsExactly("Crocin", "10's", "18%", "118.00", "112.00", "A1");
        ReportRules.Result detail = report("stock-detail", FROM, TO);
        assertThat(detail.rows().get(0))
                .containsExactly("Crocin", "B1", "2027-06", "7mo", 5, "118.00", "50.00", "250.00");
        assertThat(detail.rows()).anyMatch(row -> "Old".equals(row.get(0)) && "Expired".equals(row.get(3)));
        ReportRules.Result summary = report("stock-summary", FROM, TO);
        assertThat(summary.rows())
                .contains(
                        List.of("Crocin", "Tablet", 5, "118.00", "250.00", "Low"),
                        List.of("Old", "Syrup", 2, "20.00", "20.00", "Expired"),
                        List.of("Ok", "Tablet", 8, "9.00", "32.00", "OK"),
                        List.of("Zinc", "—", 0, "0.00", "0.00", "Out"));
    }

    @Test
    void anInvalidRangeAndUnknownReportAreRefused() {
        assertThat(ReportRules.window("2026-11-30", "2026-11-01", TODAY).problem())
                .isEqualTo("The date range is not valid.");
        assertThat(ReportRules.known("balance-sheet")).isFalse();
        assertThat(ReportRules.csv(report("gstr1", FROM, TO)))
                .startsWith("GST slab,Qty,Taxable,CGST,SGST,Total tax,Total\n");
    }

    private static ReportRules.Result report(String id, LocalDate from, LocalDate to) {
        return ReportRules.run(id, books(), from, to, TODAY);
    }

    private static ReportBooks books() {
        return new ReportBooks(
                List.of(
                        bill("INV-1", "Ada", "9886012345", "cash", "2026-11-02", "236.00", 2, 1, "118.00", 18, "50.00"),
                        bill(
                                "INV-2",
                                "Beena",
                                "9886011111",
                                "credit",
                                "2026-10-01",
                                "118.00",
                                1,
                                0,
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
                                0,
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
                List.of(new ReportBooks.PurchaseReturn(
                        "RET-P",
                        "PUR-001",
                        at("2026-12-02"),
                        LocalDate.parse("2026-12-02"),
                        45,
                        List.of(new ReportBooks.PurchaseReturnLine(0, 4)))),
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
                        product(
                                "med-a",
                                "Crocin",
                                "10's",
                                "Tablet",
                                20,
                                "A1",
                                batch("B1", "2027-06", 5, "50.00", "118.00", 18)),
                        product("zinc", "Zinc", null, null, 5, null),
                        product("old", "Old", null, "Syrup", 1, null, batch("B9", "2026-10", 2, "10.00", "20.00", 5)),
                        product("ok", "Ok", null, "Tablet", 1, null, batch("B2", "2028-01", 8, "4.00", "9.00", 0))),
                List.of(new ReportBooks.Offer("OFR-002", "flat", new BigDecimal("6.00"), "product", "med-a")));
    }

    private static ReportBooks.Bill bill(
            String number,
            String name,
            String phone,
            String payMode,
            String day,
            String payable,
            int qty,
            int returned,
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
                        0, "med-a", "Crocin", "B1", qty, returned, new BigDecimal(price), gst, new BigDecimal(rate))));
    }

    private static ReportBooks.Product product(
            String id, String name, String pack, String type, int reorder, String rack, ReportBooks.Batch... batches) {
        return new ReportBooks.Product(id, name, pack, type, reorder, rack, List.of(batches));
    }

    private static ReportBooks.Batch batch(String batchNo, String expiry, int qty, String rate, String mrp, int gst) {
        return new ReportBooks.Batch(batchNo, expiry, qty, new BigDecimal(rate), new BigDecimal(mrp), gst);
    }

    private static Instant at(String day) {
        return LocalDate.parse(day).atStartOfDay(ReportRules.ZONE).toInstant();
    }
}
