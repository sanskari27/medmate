package com.medmate.server.offers;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ActiveOffers {

    List<Discount> list(UUID pharmacyId);

    record Discount(String id, String title, String type, BigDecimal value, String scope, String target) {}
}
