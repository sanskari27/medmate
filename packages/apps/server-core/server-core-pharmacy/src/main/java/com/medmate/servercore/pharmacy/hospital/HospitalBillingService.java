package com.medmate.servercore.pharmacy.hospital;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.StockMath;
import com.medmate.servercore.pharmacy.inventory.StockChanges;
import org.springframework.stereotype.Service;

@Service
public class HospitalBillingService {
    private final ObjectMapper mapper;

    public HospitalBillingService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode unlockRequired(boolean unlocked) {
        if (!unlocked) {
            throw new ApiError(403, "FORBIDDEN", "Unlock pricing with the admin OTP first");
        }
        return null;
    }

    public ObjectNode setUniformDiscount(ObjectNode state, double percent, boolean unlocked) {
        unlockRequired(unlocked);
        ObjectNode account = account(state);
        account.put("discountPct", Math.max(0, Math.min(95, Math.round(percent))));
        return account;
    }

    public ObjectNode setPriceRule(ObjectNode state, String productId, JsonNode rule, boolean unlocked) {
        unlockRequired(unlocked);
        ObjectNode rules = state.get("hospitalPriceRules") instanceof ObjectNode existing ? existing : state.putObject("hospitalPriceRules");
        if (rule == null || rule.isNull() || !rule.path("value").isNumber() || rule.path("value").asDouble() < 0) {
            rules.remove(productId);
        } else {
            ObjectNode saved = rules.putObject(productId);
            saved.put("mode", rule.path("mode").asText());
            saved.put("value", StockMath.round2(rule.path("value").asDouble()));
        }
        return rules;
    }

    public ObjectNode issueSupply(ObjectNode state, JsonNode draft) {
        return move(state, draft, true);
    }

    public ObjectNode returnSupply(ObjectNode state, JsonNode draft) {
        return move(state, draft, false);
    }

    public ObjectNode issueIndent(ObjectNode state, String indentId) {
        ObjectNode indent = Nodes.findId(state.withArray("wardIndents"), indentId);
        if (indent == null || indent.withArray("items").isEmpty()) {
            return mapper.createObjectNode().put("ok", false);
        }
        ArrayNode items = mapper.createArrayNode();
        for (JsonNode item : indent.withArray("items")) {
            ObjectNode product = matchProduct(state, item.path("name").asText());
            if (product == null) {
                return mapper.createObjectNode().put("ok", false);
            }
            ObjectNode batch = StockMath.earliestBatch(product);
            double price = creditPrice(product, state);
            ObjectNode line = items.addObject();
            line.put("productId", product.path("id").asText());
            line.put("name", product.path("name").asText());
            line.put("batchNo", batch == null ? "—" : batch.path("batchNo").asText());
            line.put("expiry", batch == null ? "—" : batch.path("expiry").asText());
            line.put("hsn", product.path("hsn").asText());
            line.put("gst", product.path("gst").asDouble());
            line.put("qty", item.path("qty").asDouble());
            line.put("price", price);
            line.put("amount", StockMath.round2(item.path("qty").asDouble() * price));
        }
        ObjectNode draft = mapper.createObjectNode();
        draft.put("wardId", indent.path("wardId").asText());
        draft.put("wardName", indent.path("wardName").asText());
        draft.put("reason", "floor");
        draft.set("items", items);
        draft.put("refDoc", indent.path("id").asText());
        draft.put("indentId", indent.path("id").asText());
        ObjectNode issued = move(state, draft, true);
        issued.put("ok", true);
        return issued;
    }

    public ObjectNode recordPayment(ObjectNode state, JsonNode body) {
        if (body.path("amount").asDouble() <= 0) {
            throw new ApiError(400, "VALIDATION", "Amount must be positive", "amount");
        }
        ObjectNode row = body.deepCopy();
        row.put("id", "HP-" + Nodes.bump(state, "hp"));
        row.put("at", System.currentTimeMillis());
        state.withArray("hospitalPayments").insert(0, row);
        return row;
    }

    public boolean checkOtp(String pin, String code, boolean development) {
        String digits = code == null ? "" : code.replaceAll("\\D", "");
        if (development && "123456".equals(digits)) {
            return true;
        }
        return digits.length() == 6 && digits.equals(pin);
    }

    private ObjectNode move(ObjectNode state, JsonNode draft, boolean issue) {
        ArrayNode items = draft.withArray("items");
        if (items.isEmpty()) {
            throw new ApiError(400, "VALIDATION", issue ? "Nothing to issue" : "Nothing to return", "qty");
        }
        if (issue) {
            assertStock(state, items);
        } else {
            for (JsonNode item : items) {
                if (StockChanges.find(state, item.path("productId").asText()) == null) {
                    throw new ApiError(400, "VALIDATION", "Product not found");
                }
            }
        }
        ArrayNode inventory = state.withArray("inventory").deepCopy();
        for (JsonNode productNode : inventory) {
            ObjectNode product = (ObjectNode) productNode;
            for (JsonNode item : items) {
                if (!product.path("id").asText().equals(item.path("productId").asText())) {
                    continue;
                }
                if (issue) {
                    String batchNo = item.path("batchNo").asText("");
                    StockChanges.takePacks(product.withArray("batches"), item.path("qty").asDouble(), "—".equals(batchNo) ? null : batchNo);
                } else {
                    restore(product, item);
                }
            }
        }
        state.set("inventory", inventory);
        ObjectNode supply = draft.deepCopy();
        supply.put("id", (issue ? "WS-" : "WR-") + Nodes.bump(state, issue ? "ws" : "wr"));
        supply.put("kind", issue ? "issue" : "return");
        supply.put("total", total(items));
        supply.put("at", System.currentTimeMillis());
        state.withArray("wardSupplies").insert(0, supply);
        if (issue && draft.hasNonNull("indentId")) {
            ObjectNode indent = Nodes.findId(state.withArray("wardIndents"), draft.path("indentId").asText());
            if (indent != null) {
                indent.put("status", "issued");
                for (JsonNode item : indent.withArray("items")) {
                    if (item instanceof ObjectNode line) {
                        line.put("issued", line.path("qty").asDouble());
                    }
                }
            }
        }
        ObjectNode response = mapper.createObjectNode();
        response.set("supply", supply);
        response.set("inventory", state.get("inventory"));
        if (issue) {
            response.set("wardIndents", state.get("wardIndents"));
        }
        return response;
    }

    private void assertStock(ObjectNode state, ArrayNode items) {
        ArrayNode copy = state.withArray("inventory").deepCopy();
        for (JsonNode item : items) {
            ObjectNode product = null;
            for (JsonNode node : copy) {
                if (item.path("productId").asText().equals(node.path("id").asText())) {
                    product = (ObjectNode) node;
                }
            }
            if (product == null) {
                throw new ApiError(400, "VALIDATION", "Product not found");
            }
            String batchNo = item.path("batchNo").asText("");
            double left = StockChanges.takePacks(product.withArray("batches"), item.path("qty").asDouble(), "—".equals(batchNo) ? null : batchNo);
            if (left > 0) {
                throw new ApiError(400, "VALIDATION", product.path("name").asText() + " does not have enough stock", "qty");
            }
        }
    }

    private static void restore(ObjectNode product, JsonNode item) {
        String batchNo = item.path("batchNo").asText("");
        for (JsonNode node : product.withArray("batches")) {
            if (node instanceof ObjectNode batch && batchNo.equals(batch.path("batchNo").asText())) {
                batch.put("qty", batch.path("qty").asDouble() + item.path("qty").asDouble());
                return;
            }
        }
        ObjectNode created = product.withArray("batches").addObject();
        created.put("batchNo", batchNo.isEmpty() ? "RET" : batchNo);
        created.put("expiry", item.path("expiry").asText("—"));
        created.put("qty", item.path("qty").asDouble());
        double price = item.has("mrp") ? item.path("mrp").asDouble() : item.path("price").asDouble();
        created.put("mrp", price);
        created.put("ptr", item.path("price").asDouble());
    }

    private static double total(ArrayNode items) {
        double amount = 0;
        for (JsonNode item : items) {
            amount += item.path("amount").asDouble();
        }
        return StockMath.round2(amount);
    }

    private static ObjectNode matchProduct(ObjectNode state, String name) {
        String folded = letters(name);
        for (JsonNode node : state.withArray("inventory")) {
            if (!(node instanceof ObjectNode product)) {
                continue;
            }
            String productName = letters(product.path("name").asText());
            if (productName.equals(folded) || folded.contains(productName) || productName.contains(folded)) {
                return product;
            }
        }
        return null;
    }

    private static String letters(String value) {
        return value == null ? "" : value.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    static double creditPrice(ObjectNode product, ObjectNode state) {
        double mrp = product.withArray("batches").isEmpty() ? 0 : product.withArray("batches").get(0).path("mrp").asDouble();
        JsonNode rule = state.path("hospitalPriceRules").get(product.path("id").asText());
        double price;
        if (rule != null && rule.isObject()) {
            price = "flat".equals(rule.path("mode").asText()) ? mrp - rule.path("value").asDouble() : mrp * (1 - rule.path("value").asDouble() / 100);
        } else {
            price = mrp * (1 - state.path("hospitalAccount").path("discountPct").asDouble() / 100);
        }
        return Math.max(0, StockMath.round2(price));
    }

    private static ObjectNode account(ObjectNode state) {
        return state.get("hospitalAccount") instanceof ObjectNode account ? account : state.putObject("hospitalAccount");
    }
}
