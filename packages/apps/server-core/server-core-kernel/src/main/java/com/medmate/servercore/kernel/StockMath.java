package com.medmate.servercore.kernel;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

public final class StockMath {
    private StockMath() {
    }

    public static String lettersAndDigits(String value) {
        return value == null ? "" : value.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    public static String productBarcode(String productId) {
        return "NM" + productId;
    }

    public static String batchBarcode(String productId, String batchNo) {
        String text = productId + "|" + batchNo;
        long hash = 5381;
        for (int index = 0; index < text.length(); index++) {
            hash = ((hash * 33) ^ text.charAt(index)) & 0xffffffffL;
        }
        String digits = Long.toString(hash);
        if (digits.length() < 10) {
            digits = "0".repeat(10 - digits.length()) + digits;
        }
        return "890" + digits.substring(digits.length() - 10);
    }

    public static int unitsPerPack(ObjectNode product) {
        String form = product.path("form").asText("");
        if (!"Tablet".equals(form) && !"Capsule".equals(form)) {
            return 1;
        }
        var matcher = java.util.regex.Pattern.compile("(\\d+)").matcher(product.path("pack").asText(""));
        if (!matcher.find()) {
            return 1;
        }
        return Math.max(1, Integer.parseInt(matcher.group(1)));
    }

    public static boolean looseSellable(ObjectNode product) {
        String form = product.path("form").asText("");
        boolean eligible = ("Tablet".equals(form) || "Capsule".equals(form)) && unitsPerPack(product) > 1;
        return eligible && Nodes.bool(product, "looseAllowed", true);
    }

    public static String unitNoun(ObjectNode product) {
        return "Capsule".equals(product.path("form").asText()) ? "capsule" : "tablet";
    }

    public static ObjectNode earliestBatch(ObjectNode product) {
        ArrayNode batches = Nodes.array(product, "batches");
        ObjectNode earliest = null;
        ObjectNode first = null;
        if (batches == null) {
            return null;
        }
        for (JsonNode node : batches) {
            if (!(node instanceof ObjectNode batch)) {
                continue;
            }
            if (first == null) {
                first = batch;
            }
            if (batch.path("qty").asDouble() > 0 && (earliest == null || batch.path("expiry").asText().compareTo(earliest.path("expiry").asText()) < 0)) {
                earliest = batch;
            }
        }
        return earliest != null ? earliest : first;
    }

    public static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public static double[] billUnit(ObjectNode product, boolean loose, String batchNo) {
        ArrayNode batches = Nodes.array(product, "batches");
        ObjectNode named = null;
        if (batchNo != null && batches != null) {
            for (JsonNode node : batches) {
                if (batchNo.equals(node.path("batchNo").asText())) {
                    named = (ObjectNode) node;
                    break;
                }
            }
        }
        ObjectNode batch = named != null ? named : earliestBatch(product);
        double packMrp = batch == null ? 0 : batch.path("mrp").asDouble();
        double packPrice = product.has("onlinePrice") && !product.get("onlinePrice").isNull()
                ? product.get("onlinePrice").asDouble() : packMrp;
        if (!loose) {
            return new double[]{packPrice, packMrp};
        }
        double tablets = Math.max(1, unitsPerPack(product));
        return new double[]{round2(packPrice / tablets), round2(packMrp / tablets)};
    }

    public record ScanHit(ObjectNode product, String batchNo) {
    }

    public static ScanHit findScan(ArrayNode inventory, String raw) {
        String typed = raw == null ? "" : raw.trim();
        if (typed.isEmpty() || inventory == null) {
            return null;
        }
        String folded = lettersAndDigits(typed);
        for (JsonNode node : inventory) {
            if (node instanceof ObjectNode product && lettersAndDigits(productBarcode(product.path("id").asText())).equals(folded)) {
                return new ScanHit(product, null);
            }
        }
        ScanHit byBatchCode = matchBatch(inventory, batch -> batchBarcode(batch.product.path("id").asText(), batch.batch.path("batchNo").asText()).equals(typed));
        if (byBatchCode != null) {
            return byBatchCode;
        }
        ScanHit byPrinted = matchBatch(inventory, batch -> {
            String batchNo = batch.batch.path("batchNo").asText("");
            return !batchNo.isEmpty() && lettersAndDigits(batchNo).equals(folded);
        });
        if (byPrinted != null) {
            return byPrinted;
        }
        ObjectNode partial = null;
        for (JsonNode node : inventory) {
            if (!(node instanceof ObjectNode product)) {
                continue;
            }
            if (lettersAndDigits(product.path("id").asText()).equals(folded) || lettersAndDigits(product.path("name").asText()).equals(folded)) {
                return new ScanHit(product, null);
            }
            if (partial == null && folded.length() >= 3 && lettersAndDigits(product.path("name").asText()).contains(folded)) {
                partial = product;
            }
        }
        return partial == null ? null : new ScanHit(partial, null);
    }

    private record BatchRef(ObjectNode product, ObjectNode batch) {
    }

    private static ScanHit matchBatch(ArrayNode inventory, java.util.function.Predicate<BatchRef> predicate) {
        for (JsonNode node : inventory) {
            if (!(node instanceof ObjectNode product)) {
                continue;
            }
            ArrayNode batches = Nodes.array(product, "batches");
            if (batches == null) {
                continue;
            }
            for (JsonNode batchNode : batches) {
                if (batchNode instanceof ObjectNode batch && predicate.test(new BatchRef(product, batch))) {
                    return new ScanHit(product, batch.path("batchNo").asText());
                }
            }
        }
        return null;
    }
}
