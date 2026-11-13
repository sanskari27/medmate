package com.medmate.server.billing;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import org.junit.jupiter.api.Test;

class BillRulesTest {

    private static final YearMonth MONTH = YearMonth.of(2026, 11);
    private static final ObjectMapper JSON = new ObjectMapper();

    @Test
    void flatOfferBeatsASmallerPercentAndCapsAtMrp() throws Exception {
        BillRules.Prepared prepared = BillRules.prepare(
                JSON.readTree(
                        """
                {"patientName":" Ada ","patientPhone":"9886012345","payMode":"cash",
                 "lines":[{"productId":"med-a","batchNo":"B1","qty":2}]}
                """));
        assertThat(prepared.problem()).isNull();
        assertThat(prepared.request().patientName()).isEqualTo("Ada");

        BillRules.Priced priced = BillRules.price(
                prepared.request(),
                List.of(stock("med-a", "B1", "2027-06", 5, "30.00", 12, false)),
                List.of(
                        offer("OFR-001", "Ten percent", "pct", "10", "all", null),
                        offer("OFR-002", "Six off", "flat", "6", "product", "med-a")),
                MONTH);

        assertThat(priced.problem()).isNull();
        assertThat(priced.lines().get(0).offerId()).isEqualTo("OFR-002");
        assertThat(priced.lines().get(0).unitPrice()).isEqualByComparingTo("24.00");
        assertThat(priced.discount()).isEqualByComparingTo("12.00");
        assertThat(priced.payable()).isEqualByComparingTo("48.00");
        assertThat(priced.prescribedBy()).isNull();

        BillRules.Priced capped = BillRules.price(
                prepared.request(),
                List.of(stock("med-a", "B1", "2027-06", 5, "30.00", 12, false)),
                List.of(offer("OFR-003", "Too big", "flat", "40", "all", null)),
                MONTH);
        assertThat(capped.lines().get(0).unitPrice()).isEqualByComparingTo("0.00");
        assertThat(capped.lines().get(0).discount()).isEqualByComparingTo("60.00");
    }

    @Test
    void percentIsTakenFromMrp() throws Exception {
        BillRules.Priced priced = BillRules.price(
                request(),
                List.of(stock("med-a", "B1", "2027-06", 5, "30.00", 5, false)),
                List.of(offer("OFR-001", "Ten percent", "pct", "10", "all", null)),
                MONTH);
        assertThat(priced.lines().get(0).unitPrice()).isEqualByComparingTo("27.00");
        assertThat(priced.lines().get(0).discount()).isEqualByComparingTo("6.00");
        assertThat(priced.subtotal()).isEqualByComparingTo("60.00");
    }

    @Test
    void aTiePrefersTheProductOfferThenTheHigherNumber() throws Exception {
        BillRules.Priced product = BillRules.price(
                request(),
                List.of(stock("med-a", "B1", "2027-06", 5, "30.00", 12, false)),
                List.of(
                        offer("OFR-010", "Storewide", "flat", "6", "all", null),
                        offer("OFR-002", "This medicine", "flat", "6", "product", "med-a")),
                MONTH);
        assertThat(product.lines().get(0).offerId()).isEqualTo("OFR-002");

        BillRules.Priced newer = BillRules.price(
                request(),
                List.of(stock("med-a", "B1", "2027-06", 5, "30.00", 12, false)),
                List.of(
                        offer("OFR-002", "Older", "flat", "6", "product", "med-a"),
                        offer("OFR-010", "Newer", "flat", "6", "product", "med-a")),
                MONTH);
        assertThat(newer.lines().get(0).offerId()).isEqualTo("OFR-010");
    }

    @Test
    void anExpiredBatchAMissingGstRateAndAnUnknownPrescriptionAreRefused() throws Exception {
        BillRules.Request request = request();
        assertThat(BillRules.price(
                                request,
                                List.of(stock("med-a", "B1", "2026-10", 5, "30.00", 12, false)),
                                List.of(),
                                MONTH)
                        .problem())
                .isEqualTo("Batch is expired");
        assertThat(BillRules.price(
                                request,
                                List.of(stock("med-a", "B1", "2026-11", 5, "30.00", null, false)),
                                List.of(),
                                MONTH)
                        .problem())
                .isEqualTo("GST rate is unknown");
        assertThat(BillRules.price(
                                request,
                                List.of(stock("med-a", "B1", "2027-06", 5, "30.00", 0, null)),
                                List.of(),
                                MONTH)
                        .problem())
                .isEqualTo("Prescription status is unknown");

        BillRules.Priced zero = BillRules.price(
                request, List.of(stock("med-a", "B1", "2026-11", 5, "30.00", 0, false)), List.of(), MONTH);
        assertThat(zero.problem()).isNull();
        assertThat(zero.lines().get(0).gst()).isZero();
    }

    @Test
    void aPrescriptionLineNeedsTheDoctorAndTheNumber() throws Exception {
        BillRules.StockLine rx = stock("med-a", "B1", "2027-06", 5, "30.00", 12, true);
        assertThat(BillRules.price(request(), List.of(rx), List.of(), MONTH).problem())
                .isEqualTo("Prescribed by is required");
        BillRules.Request numbered =
                new BillRules.Request("Ada", "9886012345", "Dr. Rao", "", none(), List.of(line()), "cash");
        assertThat(BillRules.price(numbered, List.of(rx), List.of(), MONTH).problem())
                .isEqualTo("Prescription number is required");
        BillRules.Request ready =
                new BillRules.Request("Ada", "9886012345", "Dr. Rao", "RX-9", none(), List.of(line()), "cash");
        BillRules.Priced priced = BillRules.price(ready, List.of(rx), List.of(), MONTH);
        assertThat(priced.problem()).isNull();
        assertThat(priced.prescribedBy()).isEqualTo("Dr. Rao");
        assertThat(priced.prescriptionNumber()).isEqualTo("RX-9");
    }

    @Test
    void thePhonePayModeAndQuantityAreCheckedBeforeAPrice() throws Exception {
        assertThat(BillRules.prepare(
                                JSON.readTree(
                                        "{\"patientName\":\" \",\"patientPhone\":\"9886012345\",\"payMode\":\"cash\",\"lines\":[]}"))
                        .problem())
                .isEqualTo("Patient name is required");
        assertThat(BillRules.prepare(
                                JSON.readTree(
                                        "{\"patientName\":\"Ada\",\"patientPhone\":\"98860\",\"payMode\":\"cash\",\"lines\":[{\"productId\":\"med-a\",\"batchNo\":\"B1\",\"qty\":1}]}"))
                        .problem())
                .isEqualTo("Phone is not valid");
        assertThat(BillRules.prepare(
                                JSON.readTree(
                                        "{\"patientName\":\"Ada\",\"patientPhone\":\"9886012345\",\"payMode\":\"upi\",\"lines\":[{\"productId\":\"med-a\",\"batchNo\":\"B1\",\"qty\":1}]}"))
                        .problem())
                .isEqualTo("Payment type is not available");
        assertThat(BillRules.prepare(
                                JSON.readTree(
                                        "{\"patientName\":\"Walk-in\",\"patientPhone\":\"9886012345\",\"payMode\":\"credit\",\"lines\":[{\"productId\":\"med-a\",\"batchNo\":\"B1\",\"qty\":1}]}"))
                        .problem())
                .isEqualTo("Credit needs a customer name");
        assertThat(BillRules.prepare(
                                JSON.readTree(
                                        "{\"patientName\":\"Ada\",\"patientPhone\":\"9886012345\",\"payMode\":\"credit\",\"lines\":[{\"productId\":\"med-a\",\"batchNo\":\"B1\",\"qty\":1}]}"))
                        .request()
                        .payMode())
                .isEqualTo("credit");
        assertThat(BillRules.prepare(
                                JSON.readTree(
                                        "{\"patientName\":\"Ada\",\"patientPhone\":\"9886012345\",\"payMode\":\"cash\",\"lines\":[]}"))
                        .problem())
                .isEqualTo("A line is required");
        assertThat(BillRules.prepare(
                                JSON.readTree(
                                        "{\"patientName\":\"Ada\",\"patientPhone\":\"9886012345\",\"payMode\":\"cash\",\"lines\":[{\"productId\":\"med-a\",\"batchNo\":\"\",\"qty\":1}]}"))
                        .problem())
                .isEqualTo("Batch is required");
        assertThat(BillRules.prepare(
                                JSON.readTree(
                                        "{\"patientName\":\"Ada\",\"patientPhone\":\"9886012345\",\"payMode\":\"cash\",\"lines\":[{\"productId\":\"med-a\",\"batchNo\":\"B1\",\"qty\":0}]}"))
                        .problem())
                .isEqualTo("Quantity is not valid");
        assertThat(BillRules.number("INV-", 1)).isEqualTo("INV-0001");
        assertThat(BillRules.number("INV-", 2)).isEqualTo("INV-0002");
        assertThat(BillRules.prepare(
                                JSON.readTree(
                                        "{\"patientName\":\"Ada\",\"patientPhone\":\"9886012345\",\"payMode\":\"cash\",\"discount\":{\"type\":\"percent\",\"value\":110},\"lines\":[{\"productId\":\"med-a\",\"batchNo\":\"B1\",\"qty\":1}]}"))
                        .problem())
                .isEqualTo("Discount is not valid");
    }

    @Test
    void aLinePercentAndABillFlatCannotTakeThePriceBelowZero() throws Exception {
        BillRules.Prepared prepared = BillRules.prepare(
                JSON.readTree(
                        """
                {"patientName":"Ada","patientPhone":"9886012345","payMode":"cash",
                 "discount":{"type":"flat","value":100},
                 "lines":[{"productId":"med-a","batchNo":"B1","qty":1,"discount":{"type":"percent","value":10}}]}
                """));
        BillRules.Priced priced = BillRules.price(
                prepared.request(),
                List.of(stock("med-a", "B1", "2027-06", 5, "30.00", 12, false)),
                List.of(offer("OFR-001", "Ten percent", "pct", "10", "all", null)),
                MONTH);
        assertThat(priced.problem()).isNull();
        assertThat(priced.lines().get(0).unitPrice()).isEqualByComparingTo("24.30");
        assertThat(priced.extraAmount()).isEqualByComparingTo("24.30");
        assertThat(priced.payable()).isEqualByComparingTo("0.00");
        assertThat(priced.discount()).isEqualByComparingTo("30.00");
    }

    private static BillRules.Adjustment none() {
        return new BillRules.Adjustment("none", BigDecimal.ZERO);
    }

    private static BillRules.Request request() {
        return new BillRules.Request("Ada", "9886012345", "", "", none(), List.of(line()), "cash");
    }

    private static BillRules.RequestLine line() {
        return new BillRules.RequestLine("med-a", "B1", 2, none());
    }

    private static BillRules.StockLine stock(
            String productId, String batchNo, String expiry, int qty, String mrp, Integer gst, Boolean prescription) {
        return new BillRules.StockLine(
                productId,
                "Crocin Advance",
                "Paracetamol",
                prescription,
                batchNo,
                expiry,
                qty,
                new BigDecimal(mrp),
                gst);
    }

    private static BillRules.Offer offer(
            String id, String title, String type, String value, String scope, String target) {
        return new BillRules.Offer(id, title, type, new BigDecimal(value), scope, target);
    }
}
