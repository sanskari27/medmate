package com.medmate.server.stock;

import java.util.List;
import java.util.UUID;

public interface InventoryNames {

    List<NamedProduct> list(UUID pharmacyId);

    boolean contains(UUID pharmacyId, String productId);

    record NamedProduct(String productId, String name) {}
}
