package com.medmate.server.stock;

import com.medmate.server.stock.store.StockStore;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"local", "prod", "identity-it"})
public class JdbcCounterStock implements CounterStock {

    private final StockStore stock;

    public JdbcCounterStock(StockStore stock) {
        this.stock = stock;
    }

    @Override
    public boolean lockPharmacy(UUID pharmacyId) {
        return stock.lockPharmacy(pharmacyId);
    }

    @Override
    public List<Batch> batches(UUID pharmacyId) {
        Map<String, List<StockStore.BatchRow>> byProduct = new HashMap<>();
        for (StockStore.BatchRow batch : stock.batches(pharmacyId)) {
            byProduct
                    .computeIfAbsent(batch.productId(), key -> new ArrayList<>())
                    .add(batch);
        }
        List<Batch> batches = new ArrayList<>();
        for (StockStore.ProductRow product : stock.products(pharmacyId)) {
            for (StockStore.BatchRow batch : byProduct.getOrDefault(product.productId(), List.of())) {
                batches.add(new Batch(
                        product.productId(),
                        product.name(),
                        product.composition(),
                        product.prescriptionRequired(),
                        batch.batchNo(),
                        batch.expiry(),
                        batch.qty(),
                        batch.mrp(),
                        batch.gst()));
            }
        }
        return batches;
    }

    @Override
    public boolean decrement(UUID pharmacyId, String productId, String batchNo, int qty) {
        return stock.reduceBatch(pharmacyId, productId, batchNo, qty) == 1;
    }
}
