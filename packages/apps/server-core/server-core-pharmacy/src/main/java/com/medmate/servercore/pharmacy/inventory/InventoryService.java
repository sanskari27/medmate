package com.medmate.servercore.pharmacy.inventory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.ProfileRules;
import com.medmate.servercore.kernel.StockMath;
import org.springframework.stereotype.Service;

@Service
public class InventoryService {
    private final ObjectMapper mapper;

    public InventoryService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode addProduct(ObjectNode state, JsonNode body) {
        ObjectNode row = body.deepCopy();
        if (!row.hasNonNull("id") || row.path("id").asText().isEmpty()) {
            row.put("id", "p" + Nodes.bump(state, "prod"));
        }
        state.withArray("inventory").insert(0, row);
        return row;
    }

    public ObjectNode importProducts(ObjectNode state, JsonNode products) {
        var names = new java.util.HashSet<String>();
        for (JsonNode product : state.withArray("inventory")) {
            names.add(product.path("name").asText("").trim().toLowerCase());
        }
        ArrayNode skipped = mapper.createArrayNode();
        int added = 0;
        if (products != null && products.isArray()) {
            for (JsonNode product : products) {
                String name = product.path("name").asText("").trim();
                if (name.isEmpty()) {
                    continue;
                }
                String key = name.toLowerCase();
                if (!names.add(key)) {
                    skipped.add(name);
                    continue;
                }
                ObjectNode copy = product.deepCopy();
                copy.put("id", "");
                copy.put("name", name);
                if (!copy.path("batches").isArray()) {
                    copy.putArray("batches");
                }
                addProduct(state, copy);
                added++;
            }
        }
        if (added == 0 && skipped.isEmpty()) {
            throw new ApiError(400, "VALIDATION", "No medicines to import");
        }
        ObjectNode response = mapper.createObjectNode();
        response.put("added", added);
        response.set("skipped", skipped);
        response.set("inventory", state.get("inventory"));
        return response;
    }

    public ObjectNode updateProduct(ObjectNode state, String id, JsonNode patch) {
        ObjectNode product = StockChanges.mustProduct(state, id);
        String kept = product.path("id").asText();
        Nodes.overlay(product, patch);
        product.put("id", kept);
        return product;
    }

    public ObjectNode addBatch(ObjectNode state, String id, JsonNode batch) {
        StockChanges.mustProduct(state, id).withArray("batches").add(batch.deepCopy());
        return StockChanges.mustProduct(state, id);
    }

    public ObjectNode setBatchQuantity(ObjectNode state, String id, String batchNo, double quantity) {
        ObjectNode product = StockChanges.mustProduct(state, id);
        for (JsonNode node : product.withArray("batches")) {
            if (batchNo.equals(node.path("batchNo").asText()) && node instanceof ObjectNode batch) {
                batch.put("qty", Math.max(0, quantity));
            }
        }
        return product;
    }

    public ObjectNode toggleOnline(ObjectNode state, String id) {
        ObjectNode product = StockChanges.mustProduct(state, id);
        product.put("online", !product.path("online").asBoolean(false));
        return product;
    }

    public ObjectNode toggleLoose(ObjectNode state, String id) {
        ObjectNode product = StockChanges.mustProduct(state, id);
        boolean allowed = product.has("looseAllowed") && !product.get("looseAllowed").isNull() ? product.get("looseAllowed").asBoolean() : true;
        product.put("looseAllowed", !allowed);
        return product;
    }

    public ObjectNode setLooseDefault(ObjectNode state, boolean allowed) {
        for (JsonNode node : state.withArray("inventory")) {
            if (node instanceof ObjectNode product && ("Tablet".equals(product.path("form").asText()) || "Capsule".equals(product.path("form").asText()))) {
                product.put("looseAllowed", allowed);
            }
        }
        return mapper.createObjectNode().set("inventory", state.get("inventory")).deepCopy();
    }

    public ObjectNode setOnlinePrice(ObjectNode state, String id, JsonNode price) {
        ObjectNode product = StockChanges.mustProduct(state, id);
        if (price == null || price.isNull()) {
            product.remove("onlinePrice");
        } else {
            product.set("onlinePrice", price);
        }
        return product;
    }

    public ObjectNode setOffer(ObjectNode state, String id, JsonNode offerId) {
        ObjectNode product = StockChanges.mustProduct(state, id);
        if (offerId == null || offerId.isNull()) {
            product.remove("offerId");
        } else {
            product.set("offerId", offerId);
        }
        return product;
    }

    public ObjectNode setSupplier(ObjectNode state, String id, String supplierId) {
        ObjectNode product = StockChanges.mustProduct(state, id);
        product.put("supplierId", supplierId);
        return product;
    }

    public ObjectNode setLocation(ObjectNode state, String id, String rack, String alternate) {
        String code = ProfileRules.normalizeRack(rack);
        if (code.isEmpty()) {
            throw new ApiError(400, "VALIDATION", "Choose a rack. A location cannot be cleared.", "rack");
        }
        ObjectNode product = StockChanges.mustProduct(state, id);
        product.put("rack", code);
        String alt = ProfileRules.normalizeRack(alternate == null ? product.path("rackAlt").asText("") : alternate);
        if (alt.isEmpty()) {
            product.remove("rackAlt");
        } else {
            product.put("rackAlt", alt);
        }
        remember(state, code);
        return product;
    }

    public ObjectNode bulkLocation(ObjectNode state, JsonNode ids, String rack) {
        String code = ProfileRules.normalizeRack(rack);
        for (JsonNode node : state.withArray("inventory")) {
            if (node instanceof ObjectNode product && contains(ids, product.path("id").asText())) {
                product.put("rack", code);
            }
        }
        remember(state, code);
        ObjectNode response = mapper.createObjectNode();
        response.set("inventory", state.get("inventory"));
        response.set("racks", state.get("racks"));
        return response;
    }

    public ObjectNode scan(ObjectNode state, String query) {
        StockMath.ScanHit hit = StockMath.findScan(Nodes.array(state, "inventory"), query);
        if (hit == null) {
            return null;
        }
        ObjectNode response = mapper.createObjectNode();
        response.set("product", hit.product());
        if (hit.batchNo() != null) {
            for (JsonNode batch : hit.product().withArray("batches")) {
                if (hit.batchNo().equals(batch.path("batchNo").asText())) {
                    response.set("batch", batch);
                }
            }
        }
        return response;
    }

    public static void remember(ObjectNode state, String code) {
        if (code == null || code.isEmpty()) {
            return;
        }
        for (JsonNode rack : state.withArray("racks")) {
            if (code.equals(rack.asText())) {
                return;
            }
        }
        state.withArray("racks").add(code);
    }

    private static boolean contains(JsonNode ids, String id) {
        if (ids == null || !ids.isArray()) {
            return false;
        }
        for (JsonNode item : ids) {
            if (id.equals(item.asText())) {
                return true;
            }
        }
        return false;
    }
}
