package com.medmate.servercore.pharmacy.sales;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.InvoiceMath;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.StockMath;
import com.medmate.servercore.pharmacy.inventory.StockChanges;
import org.springframework.stereotype.Service;

@Service
public class CheckoutService {
    private final ObjectMapper mapper;

    public CheckoutService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode checkout(ObjectNode state, JsonNode input) {
        JsonNode customer = input.path("customer");
        ArrayNode lines = input.withArray("lines");
        ArrayNode resolved = mapper.createArrayNode();
        for (JsonNode line : lines) {
            if (line.path("qty").asDouble() <= 0) {
                continue;
            }
            ObjectNode product = StockChanges.mustProduct(state, line.path("productId").asText());
            ObjectNode row = resolved.addObject();
            row.set("product", product);
            row.put("qty", line.path("qty").asDouble());
            row.put("loose", line.path("loose").asBoolean(false));
            if (line.hasNonNull("batchNo")) {
                row.put("batchNo", line.path("batchNo").asText());
            }
        }
        if (resolved.isEmpty()) {
            throw new ApiError(400, "VALIDATION", "Nothing to bill", "qty");
        }
        StockChanges.deduct(state, lines);
        ArrayNode items = mapper.createArrayNode();
        boolean hasRx = false;
        for (JsonNode row : resolved) {
            ObjectNode product = (ObjectNode) row.get("product");
            boolean loose = row.path("loose").asBoolean(false);
            String requested = row.path("batchNo").asText("");
            ObjectNode batch = requested.isEmpty() ? StockMath.earliestBatch(product) : named(product, requested);
            if (batch == null) {
                batch = StockMath.earliestBatch(product);
            }
            double[] unit = StockMath.billUnit(product, loose, batch == null ? null : batch.path("batchNo").asText());
            ObjectNode item = items.addObject();
            item.put("productId", product.path("id").asText());
            item.put("name", loose ? product.path("name").asText() + " — loose " + StockMath.unitNoun(product) + "s" : product.path("name").asText());
            item.put("batchNo", batch == null ? "—" : batch.path("batchNo").asText("—"));
            item.put("expiry", batch == null ? "—" : batch.path("expiry").asText("—"));
            item.put("hsn", product.path("hsn").asText());
            item.put("qty", row.path("qty").asDouble());
            item.put("mrp", unit[1]);
            item.put("price", unit[0]);
            item.put("gst", product.path("gst").asDouble());
            if (loose) {
                item.put("loose", true);
            }
            if (!"OTC".equals(product.path("schedule").asText("OTC"))) {
                hasRx = true;
            }
        }
        double raw = input.path("discount").asDouble(0);
        double gross = 0;
        for (JsonNode item : items) {
            gross += item.path("price").asDouble() * item.path("qty").asDouble();
        }
        double effective = "percent".equals(input.path("discountMode").asText()) ? Math.round((gross * raw) / 100.0) : raw;
        double discount = InvoiceMath.totals(items, effective).discount();
        String name = customer.path("name").asText("").trim();
        if (name.isEmpty()) {
            name = "Walk-in";
        }
        ObjectNode prescription = null;
        if (input.hasNonNull("rxImage") && !input.path("rxImage").asText().isEmpty()) {
            prescription = mapper.createObjectNode();
            prescription.put("id", "RX-" + Nodes.bump(state, "rx"));
            prescription.put("patient", name);
            prescription.put("phone", customer.path("phone").asText("—").isEmpty() ? "—" : customer.path("phone").asText("—"));
            prescription.put("doctor", customer.path("doctor").asText("").isEmpty() ? "Counter prescription" : customer.path("doctor").asText());
            prescription.put("uploadedAt", System.currentTimeMillis());
            prescription.put("channel", "offline");
            prescription.put("status", "dispensed");
            ArrayNode rxItems = prescription.putArray("items");
            for (JsonNode row : resolved) {
                rxItems.add(row.get("product").path("id").asText());
            }
            prescription.put("kind", "uploaded");
            prescription.put("fileType", "image");
            prescription.put("image", input.path("rxImage").asText());
            prescription.put("note", "Uploaded at billing counter");
        }
        boolean credit = "credit".equals(input.path("payMode").asText());
        boolean paid = credit ? false : !input.has("paid") || input.path("paid").asBoolean(true);
        boolean hospital = "hospital".equals(state.path("businessType").asText());
        ObjectNode sale = mapper.createObjectNode();
        sale.put("id", state.path("invoiceSettings").path("prefix").asText("INV-") + Nodes.bump(state, "inv"));
        sale.put("channel", "offline");
        sale.put("status", "completed");
        ObjectNode buyer = sale.putObject("customer");
        buyer.put("name", name);
        if (!customer.path("phone").asText("").isEmpty()) {
            buyer.put("phone", customer.path("phone").asText());
        }
        if (!customer.path("email").asText("").isEmpty()) {
            buyer.put("email", customer.path("email").asText());
        }
        if (hasRx && !customer.path("rxSource").asText("").isEmpty()) {
            buyer.put("rxSource", customer.path("rxSource").asText());
        }
        if (hasRx && "doctor".equals(customer.path("rxSource").asText()) && !customer.path("doctor").asText("").isEmpty()) {
            buyer.put("doctor", customer.path("doctor").asText());
        }
        sale.set("items", items);
        sale.put("discount", discount);
        sale.put("payMode", input.path("payMode").asText());
        sale.put("rx", hasRx || prescription != null);
        if (prescription != null) {
            sale.put("rxId", prescription.path("id").asText());
        }
        long now = System.currentTimeMillis();
        sale.put("createdAt", now);
        ObjectNode event = sale.putArray("history").addObject();
        event.put("status", "completed");
        event.put("at", now);
        if (credit) {
            event.put("note", "On credit (khata) · " + name);
        } else if (!paid) {
            event.put("note", "Sent to reception · payment pending");
        }
        sale.put("paid", paid);
        sale.put("reception", !paid && !credit);
        if ("ward".equals(input.path("source").asText()) && input.hasNonNull("ward")) {
            sale.put("ward", input.path("ward").asText());
        }
        if (hospital && input.hasNonNull("source")) {
            sale.put("source", input.path("source").asText());
        }
        if ("insurance".equals(input.path("payMode").asText()) && !input.path("insurer").asText("").isEmpty()) {
            sale.put("insurer", input.path("insurer").asText());
        }
        if (hospital && ("ward".equals(input.path("source").asText()) || "emergency".equals(input.path("source").asText()))) {
            String patientId = input.path("patientId").asText("").trim();
            if (!patientId.isEmpty()) {
                sale.put("patientId", patientId);
            }
        }
        if (prescription != null) {
            state.withArray("prescriptions").insert(0, prescription);
        }
        state.withArray("sales").insert(0, sale);
        ObjectNode response = mapper.createObjectNode();
        response.set("sale", sale);
        if (prescription == null) {
            response.putNull("prescription");
        } else {
            response.set("prescription", prescription);
        }
        response.set("inventory", state.get("inventory"));
        return response;
    }

    private static ObjectNode named(ObjectNode product, String batchNo) {
        ArrayNode batches = Nodes.array(product, "batches");
        if (batches == null) {
            return null;
        }
        for (JsonNode batch : batches) {
            if (batchNo.equals(batch.path("batchNo").asText())) {
                return (ObjectNode) batch;
            }
        }
        return null;
    }
}
