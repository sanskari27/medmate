package com.medmate.server.stock;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CounterStock {

    boolean lockPharmacy(UUID pharmacyId);

    List<Batch> batches(UUID pharmacyId);

    boolean decrement(UUID pharmacyId, String productId, String batchNo, int qty);

    boolean increment(UUID pharmacyId, String productId, String batchNo, int qty);

    record Batch(
            String productId,
            String name,
            String composition,
            Boolean prescriptionRequired,
            String batchNo,
            String expiry,
            int qty,
            BigDecimal mrp,
            Integer gst) {}
}
