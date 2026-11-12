package com.medmate.server.offers;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class OfferRulesTest {

    @Test
    void titleIsRequired() {
        ObjectNode body = offer();
        body.remove("title");
        assertThat(OfferRules.prepareCreate(body, none()).problem()).isEqualTo("Title is required");

        body = offer();
        body.put("title", "  ");
        assertThat(OfferRules.prepareCreate(body, none()).problem()).isEqualTo("Title is required");
    }

    @Test
    void couponIsStoredUppercased() {
        OfferRules.Prepared prepared = OfferRules.prepareCreate(offer(), none());

        assertThat(prepared.problem()).isNull();
        assertThat(prepared.draft().code()).isEqualTo("NAMMA25");
        assertThat(prepared.draft().title()).isEqualTo("Monsoon Health Sale");
        assertThat(prepared.draft().active()).isTrue();
    }

    @Test
    void zeroDiscountIsRefused() {
        ObjectNode body = offer();
        body.put("value", 0);

        assertThat(OfferRules.prepareCreate(body, none()).problem()).isEqualTo("Discount must be greater than zero");
    }

    @Test
    void aThirdDecimalIsRefused() {
        ObjectNode body = offer();
        body.put("value", new BigDecimal("10.555"));

        assertThat(OfferRules.prepareCreate(body, none()).problem()).isEqualTo("Discount is invalid");
    }

    @Test
    void scopeAllClearsTheTarget() {
        ObjectNode body = offer();
        body.put("target", "med-1");

        OfferRules.Prepared prepared = OfferRules.prepareCreate(body, id -> {
            throw new AssertionError(id);
        });

        assertThat(prepared.problem()).isNull();
        assertThat(prepared.draft().scope()).isEqualTo("all");
        assertThat(prepared.draft().target()).isNull();
    }

    @Test
    void aProductOfferNeedsAProduct() {
        ObjectNode body = offer();
        body.put("scope", "product");
        body.remove("target");

        assertThat(OfferRules.prepareCreate(body, none()).problem()).isEqualTo("Product is required");
    }

    @Test
    void anUnknownProductIsRefused() {
        ObjectNode body = offer();
        body.put("scope", "product");
        body.put("target", "med-missing");

        assertThat(OfferRules.prepareCreate(body, none()).problem()).isEqualTo("Product was not found");
    }

    private static ObjectNode offer() {
        ObjectNode body = JsonNodeFactory.instance.objectNode();
        body.put("title", "Monsoon Health Sale");
        body.put("code", " namma25 ");
        body.put("type", "pct");
        body.put("value", new BigDecimal("10"));
        body.put("scope", "all");
        return body;
    }

    private static OfferRules.Products none() {
        return id -> false;
    }
}
