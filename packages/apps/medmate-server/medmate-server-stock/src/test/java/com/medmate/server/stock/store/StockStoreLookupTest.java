package com.medmate.server.stock.store;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class StockStoreLookupTest {

    @Test
    void aPurchaseSearchMatchesTheDistributorInvoice() {
        assertThat(StockStore.documentUnion()).contains("p.invoice_no");
        assertThat(StockStore.documentUnion()).contains("d.name");
    }

    @Test
    void inventorySearchMatchesBatchAndRackAndLowStockUsesReorder() {
        String facts = StockStore.inventoryFacts(true);
        assertThat(facts).contains("found.batch_no");
        assertThat(facts).contains("p.rack");
        assertThat(facts).contains("p.rack_alt");
        assertThat(facts).contains("b.expiry < :currentMonth");
        assertThat(StockStore.inventoryMatch()).contains("units <= reorder_level");
        assertThat(StockStore.inventoryMatch()).contains("expired");
    }
}
