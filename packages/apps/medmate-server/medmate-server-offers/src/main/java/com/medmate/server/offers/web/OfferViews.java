package com.medmate.server.offers.web;

import java.math.BigDecimal;
import java.util.List;

public final class OfferViews {

    private OfferViews() {}

    public record OfferView(
            String id,
            String title,
            String code,
            String type,
            BigDecimal value,
            String scope,
            String target,
            boolean active,
            int itemCount) {}

    public record ProductView(String productId, String name) {}

    public record ListResponse(List<OfferView> offers, List<ProductView> products) {}

    public record OneResponse(OfferView offer) {}
}
