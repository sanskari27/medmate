package com.medmate.server.offers;

import com.medmate.server.offers.store.OfferStore;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"local", "prod", "identity-it"})
public class JdbcActiveOffers implements ActiveOffers {

    private final OfferStore offers;

    public JdbcActiveOffers(OfferStore offers) {
        this.offers = offers;
    }

    @Override
    public List<Discount> list(UUID pharmacyId) {
        List<Discount> discounts = new ArrayList<>();
        for (OfferStore.OfferRow row : offers.list(pharmacyId)) {
            if (!row.active()) {
                continue;
            }
            discounts.add(new Discount(row.code(), row.title(), row.type(), row.value(), row.scope(), row.productId()));
        }
        return discounts;
    }
}
