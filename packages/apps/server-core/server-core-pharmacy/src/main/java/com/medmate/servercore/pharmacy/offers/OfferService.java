package com.medmate.servercore.pharmacy.offers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.pharmacy.inventory.StockChanges;
import com.medmate.servercore.pharmacy.store.RowEdits;
import org.springframework.stereotype.Service;

@Service
public class OfferService {
    private final ObjectMapper mapper;

    public OfferService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode add(ObjectNode state, JsonNode body) {
        ObjectNode row = body.deepCopy();
        if (row.path("id").asText("").isEmpty()) {
            row.put("id", "of" + Nodes.bump(state, "crm"));
        }
        state.withArray("offers").insert(0, row);
        return row;
    }

    public ObjectNode toggle(ObjectNode state, String id) {
        ObjectNode offer = RowEdits.require(state, "offers", id, "Offer not found");
        offer.put("active", !offer.path("active").asBoolean(false));
        return offer;
    }

    public ObjectNode remove(ObjectNode state, String id) {
        RowEdits.remove(state, "offers", id);
        return mapper.createObjectNode().set("offers", state.get("offers"));
    }

    public ObjectNode direct(ObjectNode state, String productId, String type, double value) {
        StockChanges.mustProduct(state, productId);
        String id = "od-" + productId;
        if (value <= 0) {
            RowEdits.remove(state, "offers", id);
            ObjectNode product = StockChanges.find(state, productId);
            if (product != null && id.equals(product.path("offerId").asText())) {
                product.remove("offerId");
            }
            ObjectNode cleared = mapper.createObjectNode();
            cleared.set("offers", state.get("offers"));
            cleared.set("inventory", state.get("inventory"));
            return cleared;
        }
        ObjectNode offer = mapper.createObjectNode();
        offer.put("id", id);
        offer.put("title", "Direct offer");
        offer.put("code", "DIRECT");
        offer.put("type", type);
        offer.put("value", value);
        offer.put("scope", "product");
        offer.put("target", productId);
        offer.put("online", true);
        offer.put("active", true);
        if (Nodes.findId(state.withArray("offers"), id) == null) {
            state.withArray("offers").insert(0, offer);
        } else {
            Nodes.overlay(Nodes.findId(state.withArray("offers"), id), offer);
        }
        StockChanges.find(state, productId).put("offerId", id);
        ObjectNode response = mapper.createObjectNode();
        response.set("offer", offer);
        response.set("inventory", state.get("inventory"));
        return response;
    }
}
