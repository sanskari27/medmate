package com.medmate.server.prep;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class PrepRulesTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void trimsANameAndRejectsABlankOrLongOne() {
        assertThat(PrepRules.name(json.createObjectNode().put("name", "  City opening  "))
                        .value())
                .isEqualTo("City opening");
        assertThat(PrepRules.name(json.createObjectNode().put("name", "  ")).problem())
                .isEqualTo(PrepRules.NAME_REQUIRED);
        assertThat(PrepRules.name(json.createObjectNode().put("name", "x".repeat(81)))
                        .problem())
                .isEqualTo(PrepRules.NAME_LONG);
    }

    @Test
    void savesABlankBatchAndRejectsARepeatedOne() {
        PrepRules.Lines draft = PrepRules.lines(body(row("DR1", "Crocin")));
        assertThat(draft.problem()).isNull();
        assertThat(draft.lines()).hasSize(1);
        assertThat(draft.lines().get(0).batchNo()).isEmpty();
        assertThat(draft.lines().get(0).expiry()).isNull();
        assertThat(draft.lines().get(0).qty()).isNull();

        ObjectNode repeated = body(row("DR1", "Crocin"), row("DR1", "Crocin"));
        assertThat(PrepRules.lines(repeated).problem()).isEqualTo(PrepRules.DUPLICATE);
        assertThat(PrepRules.lines(json.createObjectNode()).problem()).isEqualTo(PrepRules.LINES_INVALID);
    }

    @Test
    void capsTheListAtTwoThousandRows() {
        assertThat(PrepRules.lines(many(2000)).problem()).isNull();
        assertThat(PrepRules.lines(many(2001)).problem()).isEqualTo(PrepRules.TOO_MANY);
    }

    @Test
    void exportRequiresACompleteLineAndQuotesTheName() {
        PrepRules.Line blank =
                PrepRules.lines(body(row("DR1", "Crocin"))).lines().get(0);
        assertThat(PrepRules.exportProblem(List.of(blank))).isEqualTo("Row 1: Batch number is required");

        ObjectNode complete = row("DR1", "Crocin, 500 mg");
        complete.put("batchNo", "B1");
        complete.put("expiry", "2027-01");
        complete.put("qty", 0);
        complete.put("free", 0);
        complete.put("rate", 12.5);
        complete.put("mrp", 25);
        complete.put("gst", 12);
        PrepRules.Line zero = PrepRules.lines(body(complete)).lines().get(0);
        assertThat(PrepRules.exportProblem(List.of(zero))).isEqualTo("Row 1: Add at least one unit");

        complete.put("qty", 10);
        PrepRules.Line ready = PrepRules.lines(body(complete)).lines().get(0);
        assertThat(PrepRules.exportProblem(List.of(ready))).isNull();
        assertThat(ready.rate()).isEqualByComparingTo(new BigDecimal("12.50"));
        assertThat(PrepRules.csv(List.of(ready)))
                .isEqualTo(
                        """
                        product_id,product_name,batch_no,expiry,qty,free,rate,mrp,gst
                        DR1,"Crocin, 500 mg",B1,2027-01,10,0,12.50,25.00,12
                        """);
        assertThat(PrepRules.fileName("City opening")).isEqualTo("city-opening.csv");
    }

    private ObjectNode body(ObjectNode... rows) {
        ArrayNode lines = json.createArrayNode();
        for (ObjectNode row : rows) {
            lines.add(row);
        }
        ObjectNode body = json.createObjectNode();
        body.set("lines", lines);
        return body;
    }

    private ObjectNode many(int count) {
        ArrayNode lines = json.createArrayNode();
        for (int index = 0; index < count; index++) {
            lines.add(row("P" + index, "Name"));
        }
        ObjectNode body = json.createObjectNode();
        body.set("lines", lines);
        return body;
    }

    private ObjectNode row(String productId, String productName) {
        ObjectNode row = json.createObjectNode();
        row.put("productId", productId);
        row.put("productName", productName);
        return row;
    }
}
