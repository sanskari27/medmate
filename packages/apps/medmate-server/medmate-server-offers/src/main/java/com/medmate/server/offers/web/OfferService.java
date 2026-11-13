package com.medmate.server.offers.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.offers.OfferRules;
import com.medmate.server.offers.store.OfferStore;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.stock.InventoryNames;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class OfferService {

    private final OfferStore offers;
    private final InventoryNames names;

    public OfferService(OfferStore offers, InventoryNames names) {
        this.offers = offers;
        this.names = names;
    }

    public OfferViews.ListResponse list(AccountPrincipal actor) {
        require(actor, OfferRules.READ, "Offers cannot be read");
        return new OfferViews.ListResponse(views(actor.pharmacyId(), offers.list(actor.pharmacyId())));
    }

    @Transactional
    public OfferViews.OneResponse create(AccountPrincipal actor, JsonNode body) {
        require(actor, OfferRules.CREATE, "Offers cannot be created");
        OfferRules.Prepared prepared = OfferRules.prepareCreate(body, products(actor.pharmacyId()));
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        if (!offers.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        String code = OfferRules.formatCode(offers.allocate(actor.pharmacyId()));
        offers.insert(actor.pharmacyId(), code, prepared.draft(), Instant.now());
        return one(actor.pharmacyId(), code);
    }

    @Transactional
    public OfferViews.OneResponse update(AccountPrincipal actor, String code, JsonNode body) {
        require(actor, OfferRules.UPDATE, "Offers cannot be updated");
        if (!offers.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        OfferStore.OfferRow current = offers.find(actor.pharmacyId(), code).orElseThrow(OfferService::missing);
        OfferRules.Prepared prepared = OfferRules.prepareUpdate(body, draft(current), products(actor.pharmacyId()));
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        offers.update(actor.pharmacyId(), code, prepared.draft());
        return one(actor.pharmacyId(), code);
    }

    @Transactional
    public void delete(AccountPrincipal actor, String code) {
        require(actor, OfferRules.DELETE, "Offers cannot be deleted");
        if (!offers.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        offers.find(actor.pharmacyId(), code).orElseThrow(OfferService::missing);
        offers.delete(actor.pharmacyId(), code);
    }

    private OfferViews.OneResponse one(UUID pharmacyId, String code) {
        OfferStore.OfferRow row = offers.find(pharmacyId, code).orElseThrow(OfferService::missing);
        return new OfferViews.OneResponse(view(row, ids(pharmacyId)));
    }

    private List<OfferViews.OfferView> views(UUID pharmacyId, List<OfferStore.OfferRow> rows) {
        Set<String> ids = ids(pharmacyId);
        List<OfferViews.OfferView> views = new ArrayList<>();
        for (OfferStore.OfferRow row : rows) {
            views.add(view(row, ids));
        }
        return views;
    }

    private OfferViews.OfferView view(OfferStore.OfferRow row, Set<String> ids) {
        boolean present = row.productId() != null && ids.contains(row.productId());
        return new OfferViews.OfferView(
                row.code(),
                row.title(),
                row.coupon(),
                row.type(),
                row.value(),
                row.scope(),
                row.productId(),
                row.active(),
                OfferRules.itemCount(row.scope(), present, ids.size()));
    }

    private Set<String> ids(UUID pharmacyId) {
        Set<String> ids = new HashSet<>();
        for (InventoryNames.NamedProduct product : names.list(pharmacyId)) {
            ids.add(product.productId());
        }
        return ids;
    }

    private OfferRules.Products products(UUID pharmacyId) {
        return productId -> names.contains(pharmacyId, productId);
    }

    private static OfferRules.Draft draft(OfferStore.OfferRow row) {
        return new OfferRules.Draft(
                row.title(), row.coupon(), row.type(), row.value(), row.scope(), row.productId(), row.active());
    }

    private boolean allowed(AccountPrincipal actor, String key) {
        return Access.pharmacy(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus(),
                actor.permissions(),
                key);
    }

    private void require(AccountPrincipal actor, String key, String detail) {
        if (!allowed(actor, key)) {
            throw forbidden(detail);
        }
    }

    private static ApiProblem missing() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Offer was not found");
    }

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem forbidden(String detail) {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }
}
