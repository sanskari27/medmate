package com.medmate.servercore.pharmacy.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.InvoiceMath;
import com.medmate.servercore.pharmacy.credit.CreditService;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class PatientBuilder {
    private static final long DAY = 86400000L;
    private final ObjectMapper mapper;

    public PatientBuilder(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ArrayNode build(ObjectNode state) {
        Set<String> creditKeys = new java.util.HashSet<>();
        for (JsonNode sale : state.withArray("sales")) {
            if ("credit".equals(sale.path("payMode").asText())) {
                creditKeys.add(CreditService.customerKey(sale.get("customer")));
            }
        }
        for (JsonNode payment : state.withArray("creditPayments")) {
            creditKeys.add(payment.path("custKey").asText());
        }
        Map<String, ObjectNode> patients = new LinkedHashMap<>();
        long now = System.currentTimeMillis();
        for (JsonNode saleNode : state.withArray("sales")) {
            if (!(saleNode instanceof ObjectNode sale) || "cancelled".equals(sale.path("status").asText())) {
                continue;
            }
            String name = sale.path("customer").path("name").asText("");
            if (name.isEmpty() || "Walk-in".equals(name) || "Kiosk (self-order)".equals(name)) {
                continue;
            }
            String key = CreditService.customerKey(sale.get("customer"));
            if (key.isEmpty()) {
                continue;
            }
            ObjectNode patient = patients.computeIfAbsent(key, ignored -> seed(key, sale));
            patient.put("orders", patient.path("orders").asInt() + 1);
            double payable = InvoiceMath.payable((ArrayNode) sale.get("items"), sale.path("discount").asDouble());
            patient.put("spent", patient.path("spent").asDouble() + payable);
            double units = 0;
            for (JsonNode item : sale.withArray("items")) {
                units += item.path("qty").asDouble();
                addMedicine(patient, item, sale.path("createdAt").asLong(), category(state, item.path("productId").asText()));
            }
            patient.put("units", patient.path("units").asDouble() + units);
            patient.put("firstAt", Math.min(patient.path("firstAt").asLong(), sale.path("createdAt").asLong()));
            patient.put("lastAt", Math.max(patient.path("lastAt").asLong(), sale.path("createdAt").asLong()));
            if ("online".equals(sale.path("channel").asText())) {
                patient.put("online", true);
                patient.put("onlineOrders", patient.path("onlineOrders").asInt() + 1);
            }
            if (sale.path("rx").asBoolean()) {
                patient.put("rx", true);
            }
        }
        double maxSpent = 1;
        for (ObjectNode patient : patients.values()) {
            maxSpent = Math.max(maxSpent, patient.path("spent").asDouble());
        }
        List<ObjectNode> ordered = new ArrayList<>(patients.values());
        for (ObjectNode patient : ordered) {
            finish(state, patient, creditKeys, now, maxSpent);
        }
        ordered.sort(Comparator.comparingDouble((ObjectNode patient) -> patient.path("spent").asDouble()).reversed());
        ArrayNode list = mapper.createArrayNode();
        ordered.forEach(list::add);
        return list;
    }

    private ObjectNode seed(String key, ObjectNode sale) {
        ObjectNode patient = mapper.createObjectNode();
        patient.put("key", key);
        patient.put("name", sale.path("customer").path("name").asText());
        patient.put("phone", sale.path("customer").path("phone").asText(""));
        patient.put("orders", 0);
        patient.put("spent", 0);
        patient.put("units", 0);
        patient.put("firstAt", sale.path("createdAt").asLong());
        patient.put("lastAt", 0);
        patient.put("online", false);
        patient.put("onlineOrders", 0);
        patient.put("rx", false);
        patient.putArray("categories");
        patient.put("chronic", false);
        patient.put("points", 0);
        patient.put("tier", "New");
        patient.put("avgOrder", 0);
        patient.putArray("medicines");
        patient.putArray("payModes");
        patient.putObject("rfm");
        patient.putArray("segments");
        patient.put("churnRisk", false);
        patient.put("daysSince", 0);
        patient.putObject("_meds");
        patient.putObject("_cats");
        return patient;
    }

    private void addMedicine(ObjectNode patient, JsonNode item, long at, String category) {
        ObjectNode meds = (ObjectNode) patient.get("_meds");
        ObjectNode medicine = meds.withObject(item.path("productId").asText());
        medicine.put("productId", item.path("productId").asText());
        medicine.put("name", item.path("name").asText());
        medicine.put("category", category);
        medicine.put("qty", medicine.path("qty").asDouble() + item.path("qty").asDouble());
        medicine.put("orders", medicine.path("orders").asInt() + 1);
        medicine.put("lastAt", Math.max(medicine.path("lastAt").asLong(), at));
        ((ObjectNode) patient.get("_cats")).put(category, at);
    }

    private void finish(ObjectNode state, ObjectNode patient, Set<String> creditKeys, long now, double maxSpent) {
        ArrayNode categories = patient.putArray("categories");
        boolean chronic = false;
        var cats = patient.get("_cats").fields();
        while (cats.hasNext()) {
            var entry = cats.next();
            categories.add(entry.getKey());
            if ("diabetes".equals(entry.getKey()) || "heart".equals(entry.getKey())) {
                chronic = true;
            }
        }
        patient.put("chronic", chronic);
        patient.put("points", (int) Math.floor(patient.path("spent").asDouble() / 100));
        int points = patient.path("points").asInt();
        patient.put("tier", points >= 120 ? "Platinum" : points >= 50 ? "Gold" : points >= 12 ? "Silver" : "New");
        patient.put("avgOrder", patient.path("orders").asInt() == 0 ? 0 : Math.round(patient.path("spent").asDouble() / patient.path("orders").asInt()));
        ArrayNode medicines = patient.putArray("medicines");
        patient.get("_meds").forEach(medicines::add);
        patient.put("daysSince", (int) Math.floor((now - patient.path("lastAt").asLong()) / (double) DAY));
        int days = patient.path("daysSince").asInt();
        int recency = days <= 15 ? 5 : days <= 30 ? 4 : days <= 60 ? 3 : days <= 90 ? 2 : 1;
        int orders = patient.path("orders").asInt();
        int frequency = orders >= 8 ? 5 : orders >= 5 ? 4 : orders >= 3 ? 3 : orders >= 2 ? 2 : 1;
        double spent = patient.path("spent").asDouble();
        int monetary = spent >= maxSpent * 0.6 ? 5 : spent >= maxSpent * 0.35 ? 4 : spent >= maxSpent * 0.18 ? 3 : spent >= maxSpent * 0.08 ? 2 : 1;
        ObjectNode rfm = patient.putObject("rfm");
        rfm.put("r", recency);
        rfm.put("f", frequency);
        rfm.put("m", monetary);
        rfm.put("score", recency + frequency + monetary);
        boolean churn = days > 60 && orders >= 2;
        patient.put("churnRisk", churn);
        ArrayNode segments = patient.putArray("segments");
        if (chronic) {
            segments.add("chronic");
        }
        if (monetary >= 4) {
            segments.add("high-value");
        }
        if (churn) {
            segments.add("lapsed");
        }
        if (creditKeys.contains(patient.path("key").asText())) {
            segments.add("credit");
        }
        if (orders == 1 && days <= 30) {
            segments.add("new");
        }
        if (segments.isEmpty()) {
            segments.add("regular");
        }
        JsonNode meta = state.path("crm").path("meta").get(patient.path("key").asText());
        if (meta != null) {
            patient.set("meta", meta);
        }
        patient.remove("_meds");
        patient.remove("_cats");
    }

    private static String category(ObjectNode state, String productId) {
        for (JsonNode product : state.withArray("inventory")) {
            if (productId.equals(product.path("id").asText())) {
                return product.path("category").asText("other");
            }
        }
        return "other";
    }
}
