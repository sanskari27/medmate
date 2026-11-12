package com.medmate.server.distributors;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import org.junit.jupiter.api.Test;

class DistributorRulesTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void nextCodeSkipsNothingAndWidensAfter999() {
        assertThat(DistributorRules.nextCode("DST", List.of())).isEqualTo("DST-001");
        assertThat(DistributorRules.nextCode("DST", List.of("DST-001", "DST-003")))
                .isEqualTo("DST-004");
        assertThat(DistributorRules.nextCode("TXN", List.of("TXN-999"))).isEqualTo("TXN-1000");
    }

    @Test
    void createDefaultsAndRejectsABadGstin() throws Exception {
        ObjectNode body = json.createObjectNode();
        body.put("name", "Bengaluru Pharma");
        body.put("phone", "9886011111");
        body.put("gstin", "29abcde1234f1z5");
        body.put("drugLicenceNumber", "ka-w-2291");
        DistributorRules.Prepared prepared = DistributorRules.prepareCreate(body);
        assertThat(prepared.problem()).isNull();
        assertThat(prepared.values().paymentTerms()).isEqualTo("30 days credit");
        assertThat(prepared.values().openingBalance()).isZero();
        assertThat(prepared.values().active()).isTrue();
        assertThat(prepared.values().showInPurchases()).isTrue();
        assertThat(prepared.values().gstin()).isEqualTo("29ABCDE1234F1Z5");
        assertThat(prepared.values().drugLicenceNumber()).isEqualTo("KA-W-2291");
        assertThat(prepared.setsInactive()).isFalse();

        body.put("gstin", "29ABC");
        assertThat(DistributorRules.prepareCreate(body).problem()).isEqualTo("GSTIN is invalid");
        body.remove("gstin");
        body.put("paymentTerms", "60 days credit");
        assertThat(DistributorRules.prepareCreate(body).problem()).isEqualTo("Payment terms are not recognised");
    }

    @Test
    void inactiveOnCreateNeedsDeleteAndUpdateKeepsItSeparate() throws Exception {
        ObjectNode body = json.createObjectNode();
        body.put("name", "Apollo Wholesale");
        body.put("phone", "9886012222");
        body.put("active", false);
        DistributorRules.Prepared created = DistributorRules.prepareCreate(body);
        assertThat(created.setsInactive()).isTrue();
        assertThat(created.needsUpdate()).isFalse();

        DistributorRules.Values current = created.values().active()
                ? created.values()
                : new DistributorRules.Values(
                        "Apollo Wholesale",
                        null,
                        "9886012222",
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        "30 days credit",
                        0,
                        true,
                        true);
        ObjectNode inactive = json.createObjectNode();
        inactive.put("active", false);
        DistributorRules.Prepared updated = DistributorRules.prepareUpdate(inactive, current, false);
        assertThat(updated.setsInactive()).isTrue();
        assertThat(updated.needsUpdate()).isFalse();

        ObjectNode keep = json.createObjectNode();
        keep.put("active", false);
        DistributorRules.Prepared still = DistributorRules.prepareUpdate(keep, updated.values(), false);
        assertThat(still.setsInactive()).isFalse();
        assertThat(still.needsUpdate()).isTrue();
    }

    @Test
    void ledgerMovesOutstandingAndLocksTheOpeningBalance() throws Exception {
        List<DistributorRules.Line> lines =
                List.of(new DistributorRules.Line("purchase", 5000), new DistributorRules.Line("payment", 2000));
        assertThat(DistributorRules.outstanding(10000, lines)).isEqualTo(13000);
        assertThat(DistributorRules.reject("return", 500, 13000)).isNull();
        assertThat(DistributorRules.outstanding(
                        10000,
                        List.of(
                                new DistributorRules.Line("purchase", 5000),
                                new DistributorRules.Line("payment", 2000),
                                new DistributorRules.Line("return", 500))))
                .isEqualTo(12500);
        assertThat(DistributorRules.reject("payment", 13001, 13000)).isEqualTo("Payment is more than the outstanding");
        assertThat(DistributorRules.reject("return", 13001, 13000)).isEqualTo("Return is more than the outstanding");
        assertThat(DistributorRules.reject("payment", 0, 13000)).isEqualTo("Payment must be at least 1");

        DistributorRules.Values current = new DistributorRules.Values(
                "Bengaluru Pharma",
                null,
                "9886011111",
                null,
                null,
                null,
                null,
                null,
                null,
                "30 days credit",
                10000,
                true,
                true);
        ObjectNode body = json.createObjectNode();
        body.put("openingBalance", 9000);
        assertThat(DistributorRules.prepareUpdate(body, current, true).problem())
                .isEqualTo("Opening balance is locked");
        body.put("openingBalance", 10000);
        assertThat(DistributorRules.prepareUpdate(body, current, true).problem())
                .isNull();
        body.put("openingBalance", 9000);
        assertThat(DistributorRules.prepareUpdate(body, current, false).problem())
                .isNull();
    }
}
