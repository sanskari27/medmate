package com.medmate.servercore.pharmacy.inventory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.StockMath;

public final class StockChanges {
    private StockChanges() {
    }

    public static ObjectNode mustProduct(ObjectNode state, String id) {
        ObjectNode product = find(state, id);
        if (product == null) {
            throw new ApiError(404, "NOT_FOUND", "Product not found");
        }
        return product;
    }

    public static ObjectNode find(ObjectNode state, String id) {
        ArrayNode inventory = Nodes.array(state, "inventory");
        if (inventory == null) {
            return null;
        }
        for (JsonNode node : inventory) {
            if (node instanceof ObjectNode product && id.equals(product.path("id").asText())) {
                return product;
            }
        }
        return null;
    }

    public static void deduct(ObjectNode state, ArrayNode lines) {
        ArrayNode inventory = Nodes.array(state, "inventory");
        ArrayNode next = inventory.deepCopy();
        for (JsonNode line : lines) {
            if (line.path("qty").asDouble() <= 0) {
                continue;
            }
            ObjectNode product = findIn(next, line.path("productId").asText());
            if (product == null) {
                throw new ApiError(404, "NOT_FOUND", "Product not found");
            }
            if (line.path("loose").asBoolean(false) && !StockMath.looseSellable(product)) {
                throw new ApiError(400, "VALIDATION", product.path("name").asText() + " cannot be sold loose");
            }
        }
        for (JsonNode node : next) {
            ObjectNode product = (ObjectNode) node;
            double packedOpen = 0;
            for (JsonNode line : lines) {
                if (!product.path("id").asText().equals(line.path("productId").asText()) || line.path("qty").asDouble() <= 0) {
                    continue;
                }
                if (!line.path("loose").asBoolean(false) && line.hasNonNull("batchNo") && !line.path("batchNo").asText().isEmpty()) {
                    unmet(product, takePacks(Nodes.array(product, "batches"), line.path("qty").asDouble(), line.path("batchNo").asText()));
                }
                if (!line.path("loose").asBoolean(false) && (!line.hasNonNull("batchNo") || line.path("batchNo").asText().isEmpty())) {
                    packedOpen += line.path("qty").asDouble();
                }
            }
            unmet(product, takePacks(Nodes.array(product, "batches"), packedOpen, null));
            double loose = product.path("looseUnits").asDouble(0);
            int perPack = StockMath.unitsPerPack(product);
            for (JsonNode line : lines) {
                if (!product.path("id").asText().equals(line.path("productId").asText()) || !line.path("loose").asBoolean(false) || line.path("qty").asDouble() <= 0) {
                    continue;
                }
                double need = line.path("qty").asDouble();
                double fromPool = Math.min(loose, need);
                loose -= fromPool;
                need -= fromPool;
                ArrayNode batches = Nodes.array(product, "batches");
                while (need > 0) {
                    int index = namedOrEarliest(batches, line.path("batchNo").asText(null));
                    if (index < 0) {
                        break;
                    }
                    ObjectNode batch = (ObjectNode) batches.get(index);
                    batch.put("qty", batch.path("qty").asDouble() - 1);
                    loose += perPack;
                    double taken = Math.min(loose, need);
                    loose -= taken;
                    need -= taken;
                }
                unmet(product, need);
            }
            if (loose != product.path("looseUnits").asDouble(0)) {
                product.put("looseUnits", loose);
            }
        }
        state.set("inventory", next);
    }

    public static void addBack(ObjectNode state, String productId, String batchNo, double quantity) {
        ObjectNode product = find(state, productId);
        if (product == null) {
            return;
        }
        ArrayNode batches = Nodes.array(product, "batches");
        if (batches == null || batches.isEmpty()) {
            return;
        }
        int index = 0;
        if (batchNo != null) {
            for (int cursor = 0; cursor < batches.size(); cursor++) {
                if (batchNo.equals(batches.get(cursor).path("batchNo").asText())) {
                    index = cursor;
                    break;
                }
            }
        }
        ObjectNode batch = (ObjectNode) batches.get(index);
        batch.put("qty", batch.path("qty").asDouble() + quantity);
    }

    private static void unmet(ObjectNode product, double left) {
        if (left > 0) {
            throw new ApiError(400, "VALIDATION", product.path("name").asText() + " does not have enough stock", "qty");
        }
    }

    public static double takePacks(ArrayNode batches, double quantity, String batchNo) {
        double need = quantity;
        if (batches == null) {
            return need;
        }
        if (batchNo != null && !batchNo.isEmpty()) {
            for (JsonNode node : batches) {
                if (node instanceof ObjectNode batch && batchNo.equals(batch.path("batchNo").asText())) {
                    double take = Math.min(batch.path("qty").asDouble(), need);
                    batch.put("qty", batch.path("qty").asDouble() - take);
                    need -= take;
                    break;
                }
            }
        }
        while (need > 0) {
            int index = earliestIndex(batches);
            if (index < 0) {
                break;
            }
            ObjectNode batch = (ObjectNode) batches.get(index);
            double take = Math.min(batch.path("qty").asDouble(), need);
            batch.put("qty", batch.path("qty").asDouble() - take);
            need -= take;
        }
        return need;
    }

    private static int earliestIndex(ArrayNode batches) {
        int chosen = -1;
        for (int index = 0; index < batches.size(); index++) {
            ObjectNode batch = (ObjectNode) batches.get(index);
            if (batch.path("qty").asDouble() > 0 && (chosen < 0 || batch.path("expiry").asText().compareTo(batches.get(chosen).path("expiry").asText()) < 0)) {
                chosen = index;
            }
        }
        return chosen;
    }

    private static int namedOrEarliest(ArrayNode batches, String batchNo) {
        if (batchNo != null && !batchNo.isEmpty() && batches != null) {
            for (int index = 0; index < batches.size(); index++) {
                if (batchNo.equals(batches.get(index).path("batchNo").asText()) && batches.get(index).path("qty").asDouble() > 0) {
                    return index;
                }
            }
        }
        return batches == null ? -1 : earliestIndex(batches);
    }

    private static ObjectNode findIn(ArrayNode inventory, String id) {
        for (JsonNode node : inventory) {
            if (id.equals(node.path("id").asText())) {
                return (ObjectNode) node;
            }
        }
        return null;
    }
}
