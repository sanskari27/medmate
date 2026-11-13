package com.medmate.server.distributors.store;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class DistributorLedgerTest {

    @Test
    void theStatementIncludesPurchasesThatAreMissingFromTheLedger() {
        String rows = DistributorStore.ledgerRows();
        assertThat(rows).contains("FROM purchase p");
        assertThat(rows).contains("t.type = 'purchase'");
        assertThat(rows).contains("t.reference = p.code");
        assertThat(rows).contains("FROM purchase_return r");
    }
}
