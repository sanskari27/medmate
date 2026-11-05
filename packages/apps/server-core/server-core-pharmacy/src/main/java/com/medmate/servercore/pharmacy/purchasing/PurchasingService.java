package com.medmate.servercore.pharmacy.purchasing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.ProfileRules;
import org.springframework.stereotype.Service;

@Service
public class PurchasingService {
    private final ObjectMapper mapper;

    public PurchasingService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode receive(ObjectNode state, JsonNode draft) {
        ArrayNode valid = mapper.createArrayNode();
        for (JsonNode item : draft.withArray("items")) {
            double received = item.path("qty").asDouble() + item.path("freeQty").asDouble(0);
            if (received > 0 && !item.path("batchNo").asText("").trim().isEmpty()) {
                valid.add(item);
            }
        }
        if (valid.isEmpty()) {
            throw new ApiError(400, "VALIDATION", "Add at least one received line");
        }
        ArrayNode inventory = state.withArray("inventory").deepCopy();
        for (JsonNode item : valid) {
            double received = item.path("qty").asDouble() + item.path("freeQty").asDouble(0);
            String productId = item.path("productId").asText("");
            if (!productId.isEmpty() && !item.path("productId").isNull()) {
                for (JsonNode node : inventory) {
                    if (!productId.equals(node.path("id").asText()) || !(node instanceof ObjectNode product)) {
                        continue;
                    }
                    boolean found = false;
                    for (JsonNode batchNode : product.withArray("batches")) {
                        if (item.path("batchNo").asText().equals(batchNode.path("batchNo").asText()) && batchNode instanceof ObjectNode batch) {
                            batch.put("qty", batch.path("qty").asDouble() + received);
                            if (item.path("mrp").asDouble() > 0) {
                                batch.put("mrp", item.path("mrp").asDouble());
                            }
                            if (item.path("ptr").asDouble() > 0) {
                                batch.put("ptr", item.path("ptr").asDouble());
                            }
                            found = true;
                        }
                    }
                    if (!found) {
                        ObjectNode batch = product.withArray("batches").addObject();
                        batch.put("batchNo", item.path("batchNo").asText());
                        batch.put("expiry", item.path("expiry").asText());
                        batch.put("qty", received);
                        batch.put("mrp", item.path("mrp").asDouble());
                        batch.put("ptr", item.path("ptr").asDouble());
                    }
                }
            } else {
                ObjectNode created = mapper.createObjectNode();
                created.put("id", "p" + Nodes.bump(state, "prod"));
                created.put("name", item.path("name").asText("").isEmpty() ? "New product" : item.path("name").asText());
                created.put("composition", item.path("composition").asText(""));
                created.put("manufacturer", item.path("manufacturer").asText(""));
                created.put("form", item.path("form").asText("").isEmpty() ? "Tablet" : item.path("form").asText());
                created.put("pack", item.path("pack").asText(""));
                created.put("category", item.path("category").asText("").isEmpty() ? "fever" : item.path("category").asText());
                created.put("hsn", item.path("hsn").asText("").isEmpty() ? "3004" : item.path("hsn").asText());
                created.put("gst", item.path("gst").asDouble());
                created.put("schedule", item.path("schedule").asText("").isEmpty() ? "OTC" : item.path("schedule").asText());
                created.put("rack", "—");
                created.put("reorderLevel", item.has("reorderLevel") ? item.path("reorderLevel").asDouble() : 20);
                created.put("online", false);
                ObjectNode batch = created.putArray("batches").addObject();
                batch.put("batchNo", item.path("batchNo").asText());
                batch.put("expiry", item.path("expiry").asText());
                batch.put("qty", received);
                batch.put("mrp", item.path("mrp").asDouble());
                batch.put("ptr", item.path("ptr").asDouble());
                inventory.insert(0, created);
            }
        }
        state.set("inventory", inventory);
        ObjectNode purchase = mapper.createObjectNode();
        purchase.put("id", "GRN-" + Nodes.bump(state, "grn"));
        purchase.put("supplierId", draft.path("supplierId").asText());
        purchase.put("supplierName", draft.path("supplierName").asText());
        purchase.put("invoiceNo", draft.path("invoiceNo").asText());
        purchase.put("invoiceDate", draft.path("invoiceDate").asText());
        purchase.set("items", valid);
        purchase.put("createdAt", System.currentTimeMillis());
        state.withArray("purchases").insert(0, purchase);
        ObjectNode response = mapper.createObjectNode();
        response.set("purchase", purchase);
        response.set("inventory", state.get("inventory"));
        return response;
    }

    public ObjectNode addSupplier(ObjectNode state, JsonNode body) {
        checkGstin(body);
        ObjectNode row = body.deepCopy();
        row.put("id", "s" + Nodes.bump(state, "supplier"));
        state.withArray("suppliers").add(row);
        return row;
    }

    public ObjectNode updateSupplier(ObjectNode state, String id, JsonNode patch) {
        return update(state, "suppliers", id, patch, "Supplier not found", true);
    }

    public ObjectNode removeSupplier(ObjectNode state, String id) {
        Nodes.removeWhere(state.withArray("suppliers"), row -> id.equals(row.path("id").asText()));
        Nodes.removeWhere(state.withArray("supplyList"), row -> id.equals(row.path("supplierId").asText()));
        ObjectNode response = mapper.createObjectNode();
        response.set("suppliers", state.get("suppliers"));
        response.set("supplyList", state.get("supplyList"));
        return response;
    }

    public ObjectNode addSupply(ObjectNode state, JsonNode body) {
        ObjectNode row = body.deepCopy();
        row.put("id", "sl" + Nodes.bump(state, "supply"));
        state.withArray("supplyList").add(row);
        return row;
    }

    public ObjectNode updateSupply(ObjectNode state, String id, JsonNode patch) {
        return update(state, "supplyList", id, patch, "Supply row not found", false);
    }

    public ObjectNode removeSupply(ObjectNode state, String id) {
        Nodes.removeWhere(state.withArray("supplyList"), row -> id.equals(row.path("id").asText()));
        return mapper.createObjectNode().set("supplyList", state.get("supplyList"));
    }

    public ObjectNode preferSupply(ObjectNode state, String id) {
        ObjectNode target = Nodes.findId(state.withArray("supplyList"), id);
        if (target == null) {
            throw new ApiError(404, "NOT_FOUND", "Supply row not found");
        }
        String productId = target.path("productId").asText();
        for (JsonNode node : state.withArray("supplyList")) {
            if (node instanceof ObjectNode row && productId.equals(row.path("productId").asText())) {
                row.put("preferred", id.equals(row.path("id").asText()));
            }
        }
        return mapper.createObjectNode().set("supplyList", state.get("supplyList"));
    }

    public ObjectNode sendOrder(ObjectNode state, String supplierId, String supplierName, JsonNode items, String note) {
        if (items == null || !items.isArray() || items.isEmpty()) {
            throw new ApiError(400, "VALIDATION", "Purchase order needs items");
        }
        ObjectNode order = mapper.createObjectNode();
        order.put("id", "PO-" + Nodes.bump(state, "po"));
        order.put("supplierId", supplierId);
        order.put("supplierName", supplierName);
        order.set("items", items.deepCopy());
        order.put("status", "sent");
        if (note != null) {
            order.put("note", note);
        }
        order.put("createdAt", System.currentTimeMillis());
        state.withArray("purchaseOrders").insert(0, order);
        return order;
    }

    public ObjectNode importOrders(ObjectNode state, JsonNode rows) {
        var groups = new java.util.LinkedHashMap<String, ObjectNode>();
        ArrayNode skipped = mapper.createArrayNode();
        if (rows != null && rows.isArray()) {
            for (JsonNode row : rows) {
                String supplierName = row.path("supplierName").asText("").trim();
                String productName = row.path("productName").asText("").trim();
                double quantity = row.path("qty").asDouble();
                ObjectNode supplier = byName(state.withArray("suppliers"), supplierName);
                ObjectNode product = byName(state.withArray("inventory"), productName);
                if (supplier == null || product == null || quantity <= 0) {
                    skipped.add(productName.isEmpty() ? (supplierName.isEmpty() ? "row" : supplierName) : productName);
                    continue;
                }
                ObjectNode group = groups.computeIfAbsent(supplier.path("id").asText(), id -> {
                    ObjectNode created = mapper.createObjectNode();
                    created.put("supplierId", supplier.path("id").asText());
                    created.put("supplierName", supplier.path("name").asText());
                    created.putArray("items");
                    if (row.has("note")) {
                        created.put("note", row.path("note").asText());
                    }
                    return created;
                });
                ObjectNode existing = null;
                for (JsonNode item : group.withArray("items")) {
                    if (product.path("id").asText().equals(item.path("productId").asText())) {
                        existing = (ObjectNode) item;
                    }
                }
                if (existing != null) {
                    existing.put("qty", existing.path("qty").asDouble() + quantity);
                } else {
                    ObjectNode line = group.withArray("items").addObject();
                    line.put("productId", product.path("id").asText());
                    line.put("name", product.path("name").asText());
                    line.put("qty", quantity);
                }
            }
        }
        int created = 0;
        for (ObjectNode group : groups.values()) {
            sendOrder(state, group.path("supplierId").asText(), group.path("supplierName").asText(), group.get("items"), group.has("note") ? group.path("note").asText() : null);
            created++;
        }
        if (created == 0) {
            throw new ApiError(400, "VALIDATION", "No matching distributor and medicine rows");
        }
        ObjectNode response = mapper.createObjectNode();
        response.put("created", created);
        response.set("skipped", skipped);
        response.set("purchaseOrders", state.get("purchaseOrders"));
        return response;
    }

    public ObjectNode markReceived(ObjectNode state, String id) {
        ObjectNode found = Nodes.findId(state.withArray("purchaseOrders"), id);
        if (found == null) {
            throw new ApiError(404, "NOT_FOUND", "Purchase order not found");
        }
        found.put("status", "received");
        return found;
    }

    private ObjectNode update(ObjectNode state, String field, String id, JsonNode patch, String missing, boolean gstin) {
        ObjectNode row = Nodes.findId(state.withArray(field), id);
        if (row == null) {
            throw new ApiError(404, "NOT_FOUND", missing);
        }
        if (gstin) {
            checkGstin(patch);
        }
        Nodes.overlay(row, patch);
        row.put("id", id);
        return row;
    }

    private static void checkGstin(JsonNode body) {
        if (body != null && body.has("gstin") && body.get("gstin").isTextual() && !body.get("gstin").asText().isBlank() && !ProfileRules.isValidGstin(body.get("gstin").asText())) {
            throw new ApiError(400, "VALIDATION", "Enter a valid GSTIN", "gstin");
        }
    }

    private static ObjectNode byName(ArrayNode rows, String name) {
        for (JsonNode node : rows) {
            if (node instanceof ObjectNode row && row.path("name").asText("").trim().equalsIgnoreCase(name.trim())) {
                return row;
            }
        }
        return null;
    }
}
