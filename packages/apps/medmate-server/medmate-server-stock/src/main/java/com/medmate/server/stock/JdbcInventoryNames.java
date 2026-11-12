package com.medmate.server.stock;

import com.medmate.server.stock.store.StockStore;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"local", "prod", "identity-it"})
public class JdbcInventoryNames implements InventoryNames {

    private final StockStore stock;

    public JdbcInventoryNames(StockStore stock) {
        this.stock = stock;
    }

    @Override
    public List<NamedProduct> list(UUID pharmacyId) {
        List<NamedProduct> names = new ArrayList<>();
        for (StockStore.ProductRow row : stock.products(pharmacyId)) {
            names.add(new NamedProduct(row.productId(), row.name()));
        }
        return names;
    }

    @Override
    public boolean contains(UUID pharmacyId, String productId) {
        return productId != null && stock.product(pharmacyId, productId).isPresent();
    }
}
