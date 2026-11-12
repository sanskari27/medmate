package com.medmate.server.stock;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class PurchaseRulesTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void roundsHalfUpAndLeavesFreeQuantityUnbilled() throws Exception {
        PurchaseRules.Prepared prepared = PurchaseRules.prepare(bill("10.50", 1, 1, 0), LocalDate.parse("2026-11-12"));
        assertThat(prepared.problem()).isNull();
        assertThat(prepared.ledgerAmount()).isEqualTo(11);
        assertThat(prepared.lines()).hasSize(1);
        assertThat(prepared.lines().get(0).freeQty()).isEqualTo(1);
        assertThat(PurchaseRules.taxable(new BigDecimal("10.50"), 1)).isEqualByComparingTo("10.50");

        PurchaseRules.Prepared taxed = PurchaseRules.prepare(bill("10.50", 1, 0, 18), LocalDate.parse("2026-11-12"));
        assertThat(taxed.ledgerAmount()).isEqualTo(12);
        assertThat(PurchaseRules.gstAmount(new BigDecimal("10.50"), 18)).isEqualByComparingTo("1.89");
    }

    @Test
    void combinesAMatchingBatchAndRejectsAMismatch() throws Exception {
        JsonNode body = json.readTree(
                """
                {
                  "distributorId": "DST-001",
                  "invoiceNo": "INV-1",
                  "invoiceDate": "2026-11-12",
                  "lines": [
                    {"productId":"DR100","batchNo":"B1","expiry":"2027-06","qty":1,"freeQty":0,"rate":10.50,"mrp":18,"gst":12},
                    {"productId":"DR100","batchNo":"B1","expiry":"2027-06","qty":2,"freeQty":1,"rate":10.50,"mrp":18,"gst":12}
                  ]
                }
                """);
        PurchaseRules.Prepared prepared = PurchaseRules.prepare(body, LocalDate.parse("2026-11-12"));
        assertThat(prepared.problem()).isNull();
        assertThat(prepared.lines()).hasSize(1);
        assertThat(prepared.lines().get(0).qty()).isEqualTo(3);
        assertThat(prepared.lines().get(0).freeQty()).isEqualTo(1);

        JsonNode mismatch = json.readTree(
                """
                {
                  "distributorId": "DST-001",
                  "invoiceNo": "INV-1",
                  "invoiceDate": "2026-11-12",
                  "lines": [
                    {"productId":"DR100","batchNo":"B1","expiry":"2027-06","qty":1,"freeQty":0,"rate":10.50,"mrp":18,"gst":12},
                    {"productId":"DR100","batchNo":"B1","expiry":"2027-07","qty":1,"freeQty":0,"rate":10.50,"mrp":18,"gst":12}
                  ]
                }
                """);
        assertThat(PurchaseRules.prepare(mismatch, LocalDate.parse("2026-11-12"))
                        .problem())
                .isEqualTo("Batch details do not match");
        assertThat(PurchaseRules.prepare(bill("10.50", 1, 0, 9), LocalDate.parse("2026-11-12"))
                        .problem())
                .isEqualTo("GST percent is not recognised");
        assertThat(PurchaseRules.prepare(bill("10.50", 1, 0, 0), LocalDate.parse("2026-11-11"))
                        .problem())
                .isEqualTo("Invoice date is in the future");
    }

    @Test
    void returnIsCappedByTheRemainingQuantityAndTheBatch() {
        PurchaseRules.Source source = new PurchaseRules.Source(0, "DR100", "B1", 2, 1, new BigDecimal("10.50"), 0);
        Map<Integer, PurchaseRules.Taken> taken = Map.of(0, new PurchaseRules.Taken(1, 0));
        Map<String, Integer> onHand = Map.of(PurchaseRules.batchKey("DR100", "B1"), 1);

        PurchaseRules.ReturnPrepared freeOnly = PurchaseRules.prepareReturn(
                List.of(source),
                Map.of(),
                Map.of(PurchaseRules.batchKey("DR100", "B1"), 3),
                json("{\"lines\":[{\"position\":0,\"qty\":0,\"freeQty\":1}]}"));
        assertThat(freeOnly.problem()).isNull();
        assertThat(freeOnly.ledgerAmount()).isZero();

        PurchaseRules.ReturnPrepared tooMany = PurchaseRules.prepareReturn(
                List.of(source), taken, onHand, json("{\"lines\":[{\"position\":0,\"qty\":2,\"freeQty\":0}]}"));
        assertThat(tooMany.problem()).isEqualTo("Return is more than the quantity received");

        PurchaseRules.ReturnPrepared batch = PurchaseRules.prepareReturn(
                List.of(source),
                Map.of(),
                Map.of(PurchaseRules.batchKey("DR100", "B1"), 1),
                json("{\"lines\":[{\"position\":0,\"qty\":2,\"freeQty\":0}]}"));
        assertThat(batch.problem()).isEqualTo("Return is more than the batch");
    }

    private JsonNode bill(String rate, int qty, int free, int gst) throws Exception {
        return json.readTree(
                """
                {
                  "distributorId": "DST-001",
                  "invoiceNo": "INV-1",
                  "invoiceDate": "2026-11-12",
                  "lines": [
                    {"productId":"DR100","batchNo":"B1","expiry":"2027-06","qty":%d,"freeQty":%d,"rate":%s,"mrp":18,"gst":%d}
                  ]
                }
                """
                        .formatted(qty, free, rate, gst));
    }

    private JsonNode json(String body) {
        try {
            return json.readTree(body);
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
