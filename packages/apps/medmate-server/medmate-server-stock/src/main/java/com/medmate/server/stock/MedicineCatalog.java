package com.medmate.server.stock;

import java.math.BigDecimal;
import java.util.List;

public interface MedicineCatalog {

    List<MedicineHit> search(String query, int limit);

    Lookup lookup(List<String> ids);

    record MedicineHit(String productId, String name, String marketer, String pack, BigDecimal mrp) {}

    record Snapshot(
            String productId,
            String name,
            String marketer,
            String composition,
            String form,
            String pack,
            String type,
            BigDecimal mrp) {}

    record Lookup(List<Snapshot> products, List<String> missing, List<String> ambiguous) {}
}
