package com.medmate.server.billing.store;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BillStoreLookupTest {

    @Test
    void aSaleSearchMatchesTheBatchOnItsLines() {
        String match = BillStore.saleMatch();
        assertThat(match).contains("l.batch_no");
        assertThat(match).contains("l.product_id");
        assertThat(match).contains("l.name");
        assertThat(match).contains("Asia/Kolkata");
        assertThat(match).contains("CASE WHEN type = 'sale' THEN id ELSE invoice_number END");
    }
}
