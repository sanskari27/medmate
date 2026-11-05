package com.medmate.servercore.pharmacy.sales;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.StockMath;
import com.medmate.servercore.pharmacy.inventory.StockChanges;
import com.medmate.servercore.pharmacy.store.AccessGuard;
import org.springframework.stereotype.Service;

@Service
public class SalesService {
    private static final String[] FLOW = {"new", "accepted", "packed", "out", "delivered"};
    private final ObjectMapper mapper;
    private final CheckoutService checkout;

    public SalesService(ObjectMapper mapper, CheckoutService checkout) {
        this.mapper = mapper;
        this.checkout = checkout;
    }

    public ArrayNode filter(ObjectNode state, String channel, String status) {
        AccessGuard.requireAnyPlan(state, "sales", "orders");
        ArrayNode matched = mapper.createArrayNode();
        for (JsonNode sale : state.withArray("sales")) {
            boolean channelOk = channel == null || channel.isEmpty() || channel.equals(sale.path("channel").asText());
            boolean statusOk = status == null || status.isEmpty() || status.equals(sale.path("status").asText());
            if (channelOk && statusOk) {
                matched.add(sale);
            }
        }
        return matched;
    }

    public ObjectNode one(ObjectNode state, String id) {
        AccessGuard.requireAnyPlan(state, "sales", "orders");
        ObjectNode sale = Nodes.findId(state.withArray("sales"), id);
        if (sale == null) {
            throw new ApiError(404, "NOT_FOUND", "Sale not found");
        }
        return sale;
    }

    public ObjectNode markPaid(ObjectNode state, String id, String payMode) {
        ObjectNode sale = require(state, id);
        sale.put("paid", true);
        sale.put("reception", false);
        sale.put("payMode", payMode);
        note(sale, "Payment received at reception · " + label(payMode));
        return sale;
    }

    public ObjectNode advance(ObjectNode state, String id) {
        ObjectNode sale = require(state, id);
        if (!"online".equals(sale.path("channel").asText())) {
            throw new ApiError(404, "NOT_FOUND", "Sale not found");
        }
        int index = index(sale.path("status").asText());
        String status = sale.path("status").asText();
        if (index < 0 || index >= FLOW.length - 1 || "accepted".equals(status) || "packed".equals(status)) {
            return sale;
        }
        String next = FLOW[index + 1];
        sale.put("status", next);
        if ("new".equals(status) && !sale.path("fulfillment").path("lines").isArray()) {
            ensureLines(sale);
        }
        history(sale, next, null);
        return sale;
    }

    public ObjectNode cancel(ObjectNode state, String id) {
        ObjectNode sale = require(state, id);
        ArrayNode lines = sale.path("fulfillment").path("lines").isArray() ? (ArrayNode) sale.path("fulfillment").get("lines") : null;
        if (lines != null) {
            for (JsonNode line : lines) {
                if (line.path("scanned").asDouble() > 0) {
                    StockChanges.addBack(state, line.path("productId").asText(), line.path("batchNo").asText(null), line.path("scanned").asDouble());
                }
            }
        }
        sale.put("status", "cancelled");
        history(sale, "cancelled", null);
        ObjectNode response = mapper.createObjectNode();
        response.set("sale", sale);
        response.set("inventory", state.get("inventory"));
        return response;
    }

    public ObjectNode startPacking(ObjectNode state, String id) {
        ObjectNode sale = require(state, id);
        if ("online".equals(sale.path("channel").asText()) && !sale.path("fulfillment").path("lines").isArray()) {
            ensureLines(sale);
        }
        return sale;
    }

    public ObjectNode scan(ObjectNode state, String id, String raw) {
        String code = raw == null ? "" : raw.trim();
        if (code.isEmpty()) {
            throw new ApiError(400, "VALIDATION", "Scan a code");
        }
        ObjectNode sale = require(state, id);
        StockMath.ScanHit hit = StockMath.findScan(Nodes.array(state, "inventory"), code);
        if (hit == null) {
            throw new ApiError(404, "NOT_FOUND", "No match for \"" + code + "\"");
        }
        ObjectNode line = line(sale, hit.product().path("id").asText());
        if (line == null) {
            throw new ApiError(400, "VALIDATION", hit.product().path("name").asText() + " is not in this order");
        }
        if (line.path("scanned").asDouble() >= line.path("qty").asDouble()) {
            throw new ApiError(409, "CONFLICT", hit.product().path("name").asText() + " already packed");
        }
        ObjectNode batch = chosenBatch(hit);
        if (batch == null) {
            throw new ApiError(409, "CONFLICT", hit.product().path("name").asText() + " is out of stock");
        }
        ArrayNode deduction = mapper.createArrayNode();
        ObjectNode request = deduction.addObject();
        request.put("productId", hit.product().path("id").asText());
        request.put("qty", 1);
        request.put("batchNo", batch.path("batchNo").asText());
        StockChanges.deduct(state, deduction);
        line.put("scanned", line.path("scanned").asDouble() + 1);
        line.put("batchNo", batch.path("batchNo").asText());
        ObjectNode response = mapper.createObjectNode();
        response.put("name", hit.product().path("name").asText());
        response.put("batchNo", batch.path("batchNo").asText());
        response.put("scanned", line.path("scanned").asDouble());
        response.put("qty", line.path("qty").asDouble());
        response.set("inventory", state.get("inventory"));
        response.set("sale", sale);
        return response;
    }

    public ObjectNode pick(ObjectNode state, String id, String productId, double delta) {
        ObjectNode sale = require(state, id);
        ObjectNode line = line(sale, productId);
        if (line == null) {
            throw new ApiError(404, "NOT_FOUND", "Pack line not found");
        }
        ObjectNode product = StockChanges.mustProduct(state, productId);
        if (delta > 0) {
            if (line.path("scanned").asDouble() >= line.path("qty").asDouble()) {
                return packed(state, sale);
            }
            ObjectNode batch = StockMath.earliestBatch(product);
            if (batch == null || batch.path("qty").asDouble() <= 0) {
                throw new ApiError(409, "CONFLICT", product.path("name").asText() + " is out of stock");
            }
            ArrayNode deduction = mapper.createArrayNode();
            ObjectNode request = deduction.addObject();
            request.put("productId", productId);
            request.put("qty", 1);
            request.put("batchNo", batch.path("batchNo").asText());
            StockChanges.deduct(state, deduction);
            line.put("scanned", line.path("scanned").asDouble() + 1);
            line.put("batchNo", batch.path("batchNo").asText());
        } else if (line.path("scanned").asDouble() > 0) {
            StockChanges.addBack(state, productId, line.path("batchNo").asText(null), 1);
            line.put("scanned", line.path("scanned").asDouble() - 1);
        }
        return packed(state, sale);
    }

    public ObjectNode seal(ObjectNode state, String id) {
        ObjectNode sale = require(state, id);
        if (!complete(sale)) {
            throw new ApiError(409, "CONFLICT", "Pack every line before sealing");
        }
        for (JsonNode itemNode : sale.withArray("items")) {
            ObjectNode item = (ObjectNode) itemNode;
            ObjectNode packLine = line(sale, item.path("productId").asText());
            if (packLine == null || packLine.path("batchNo").asText("").isEmpty()) {
                continue;
            }
            ObjectNode product = StockChanges.find(state, item.path("productId").asText());
            ObjectNode batch = product == null ? null : named(product, packLine.path("batchNo").asText());
            item.put("batchNo", packLine.path("batchNo").asText());
            if (batch != null) {
                item.put("expiry", batch.path("expiry").asText());
            }
        }
        sale.put("status", "packed");
        ObjectNode fulfillment = fulfillment(sale);
        fulfillment.put("sealed", true);
        fulfillment.put("sealedAt", System.currentTimeMillis());
        history(sale, "packed", "Scanned, invoiced & sealed in a Namma MedMate packet");
        return sale;
    }

    public ObjectNode handover(ObjectNode state, String id, JsonNode rider) {
        ObjectNode sale = require(state, id);
        if (!"packed".equals(sale.path("status").asText())) {
            throw new ApiError(409, "CONFLICT", "Seal the packet first");
        }
        sale.put("status", "out");
        ObjectNode fulfillment = fulfillment(sale);
        if (rider != null && rider.isObject()) {
            fulfillment.set("rider", rider);
        }
        fulfillment.put("handedAt", System.currentTimeMillis());
        String riderName = fulfillment.path("rider").path("name").asText("");
        String phone = fulfillment.path("rider").path("phone").asText("");
        String note = riderName.isEmpty() ? "Handed to delivery partner" : "Handed to delivery partner " + riderName + (phone.isEmpty() ? "" : " · " + phone);
        history(sale, "out", note);
        return sale;
    }

    public ObjectNode settle(ObjectNode state, JsonNode ids, String payMode) {
        for (JsonNode saleNode : state.withArray("sales")) {
            if (!(saleNode instanceof ObjectNode sale) || ids == null || !ids.isArray()) {
                continue;
            }
            for (JsonNode id : ids) {
                if (sale.path("id").asText().equals(id.asText())) {
                    sale.put("paid", true);
                    sale.put("reception", false);
                    sale.put("payMode", payMode);
                    note(sale, "Settled · " + label(payMode));
                }
            }
        }
        return mapper.createObjectNode().set("sales", state.get("sales"));
    }

    public ObjectNode kiosk(ObjectNode state, JsonNode lines, String payMode) {
        ObjectNode input = mapper.createObjectNode();
        input.set("lines", lines == null ? mapper.createArrayNode() : lines);
        input.putObject("customer").put("name", "Kiosk (self-order)");
        input.put("payMode", payMode);
        input.put("paid", true);
        input.put("discount", 0);
        ObjectNode built = checkout.checkout(state, input);
        ObjectNode sale = (ObjectNode) built.get("sale");
        sale.putObject("customer").put("name", "Kiosk (self-order)");
        ArrayNode history = sale.putArray("history");
        ObjectNode event = history.addObject();
        event.put("status", "completed");
        event.put("at", sale.path("createdAt").asLong());
        ObjectNode response = mapper.createObjectNode();
        response.set("sale", sale);
        response.set("inventory", state.get("inventory"));
        return response;
    }

    private ObjectNode packed(ObjectNode state, ObjectNode sale) {
        ObjectNode response = mapper.createObjectNode();
        response.set("sale", sale);
        response.set("inventory", state.get("inventory"));
        return response;
    }

    private static boolean complete(ObjectNode sale) {
        if (!sale.path("fulfillment").path("lines").isArray() || sale.path("fulfillment").path("lines").isEmpty()) {
            return false;
        }
        for (JsonNode line : sale.path("fulfillment").path("lines")) {
            if (line.path("scanned").asDouble() < line.path("qty").asDouble()) {
                return false;
            }
        }
        return true;
    }

    private static ObjectNode chosenBatch(StockMath.ScanHit hit) {
        if (hit.batchNo() != null) {
            ObjectNode named = named(hit.product(), hit.batchNo());
            if (named != null && named.path("qty").asDouble() > 0) {
                return named;
            }
        }
        ObjectNode earliest = null;
        for (JsonNode node : hit.product().withArray("batches")) {
            if (node.path("qty").asDouble() > 0 && (earliest == null || node.path("expiry").asText().compareTo(earliest.path("expiry").asText()) < 0)) {
                earliest = (ObjectNode) node;
            }
        }
        return earliest;
    }

    private static ObjectNode named(ObjectNode product, String batchNo) {
        for (JsonNode batch : product.withArray("batches")) {
            if (batchNo.equals(batch.path("batchNo").asText())) {
                return (ObjectNode) batch;
            }
        }
        return null;
    }

    private void ensureLines(ObjectNode sale) {
        ObjectNode fulfillment = fulfillment(sale);
        ArrayNode lines = fulfillment.putArray("lines");
        for (JsonNode item : sale.withArray("items")) {
            ObjectNode line = lines.addObject();
            line.put("productId", item.path("productId").asText());
            line.put("name", item.path("name").asText());
            line.put("qty", item.path("qty").asDouble());
            line.put("scanned", 0);
        }
    }

    private static ObjectNode fulfillment(ObjectNode sale) {
        if (sale.get("fulfillment") instanceof ObjectNode fulfillment) {
            return fulfillment;
        }
        return sale.putObject("fulfillment");
    }

    private static ObjectNode line(ObjectNode sale, String productId) {
        JsonNode lines = sale.path("fulfillment").path("lines");
        if (!lines.isArray()) {
            return null;
        }
        for (JsonNode line : lines) {
            if (productId.equals(line.path("productId").asText())) {
                return (ObjectNode) line;
            }
        }
        return null;
    }

    private static ObjectNode require(ObjectNode state, String id) {
        ObjectNode sale = Nodes.findId(state.withArray("sales"), id);
        if (sale == null) {
            throw new ApiError(404, "NOT_FOUND", "Sale not found");
        }
        return sale;
    }

    private static void history(ObjectNode sale, String status, String note) {
        ObjectNode event = sale.withArray("history").addObject();
        event.put("status", status);
        event.put("at", System.currentTimeMillis());
        if (note != null) {
            event.put("note", note);
        }
    }

    private static void note(ObjectNode sale, String note) {
        history(sale, sale.path("status").asText(), note);
    }

    private static int index(String status) {
        for (int cursor = 0; cursor < FLOW.length; cursor++) {
            if (FLOW[cursor].equals(status)) {
                return cursor;
            }
        }
        return -1;
    }

    public static String label(String mode) {
        return switch (mode == null ? "" : mode) {
            case "cash" -> "Cash";
            case "upi" -> "UPI";
            case "card" -> "Card";
            case "cod" -> "Cash on Delivery";
            case "credit" -> "Credit (Khata)";
            case "insurance" -> "Insurance / TPA";
            default -> mode == null ? "" : mode;
        };
    }
}
