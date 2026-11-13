package com.medmate.server.billing;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface PatientBills {

    List<Sale> sales(UUID pharmacyId);

    List<Refund> refunds(UUID pharmacyId);

    record Sale(
            String number,
            String name,
            String phone,
            String payMode,
            Instant soldAt,
            BigDecimal payable,
            int units,
            boolean prescription) {}

    record Refund(String code, String billNumber, BigDecimal amount, Instant at) {}
}
