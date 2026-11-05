package com.medmate.servercore.pharmacy.hospital;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.InvoiceMath;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PatientLedgerService {
    private final ObjectMapper mapper;

    public PatientLedgerService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ArrayNode ledger(ObjectNode state) {
        Map<String, ObjectNode> groups = new LinkedHashMap<>();
        for (JsonNode node : state.withArray("sales")) {
            if (!(node instanceof ObjectNode sale) || "cancelled".equals(sale.path("status").asText()) || !inPatient(sale)) {
                continue;
            }
            String patientId = sale.path("patientId").asText("").trim();
            String key = patientId.isEmpty() ? sale.path("customer").path("name").asText() + "|" + sale.path("ward").asText("") : patientId;
            ObjectNode group = groups.computeIfAbsent(key, ignored -> seed(sale, key, patientId));
            double amount = InvoiceMath.payable((ArrayNode) sale.get("items"), sale.path("discount").asDouble());
            group.withArray("bills").add(sale);
            group.put("total", group.path("total").asDouble() + amount);
            if (sale.has("paid") && sale.get("paid").isBoolean() && !sale.get("paid").asBoolean()) {
                group.put("outstanding", group.path("outstanding").asDouble() + amount);
                group.put("unsettled", group.path("unsettled").asInt() + 1);
            } else {
                group.put("paid", group.path("paid").asDouble() + amount);
            }
            if (sale.path("createdAt").asLong() > group.path("lastAt").asLong()) {
                group.put("lastAt", sale.path("createdAt").asLong());
                group.put("name", sale.path("customer").path("name").asText());
                if (sale.has("ward")) {
                    group.put("ward", sale.path("ward").asText("—"));
                }
            }
        }
        ArrayNode list = mapper.createArrayNode();
        groups.values().stream()
                .sorted((left, right) -> {
                    int money = Double.compare(right.path("outstanding").asDouble(), left.path("outstanding").asDouble());
                    return money != 0 ? money : Long.compare(right.path("lastAt").asLong(), left.path("lastAt").asLong());
                })
                .forEach(list::add);
        return list;
    }

    private ObjectNode seed(ObjectNode sale, String key, String patientId) {
        ObjectNode group = mapper.createObjectNode();
        group.put("key", key);
        group.put("patientId", patientId);
        group.put("name", sale.path("customer").path("name").asText());
        group.put("ward", sale.path("ward").asText("—"));
        group.put("source", source(sale));
        group.putArray("bills");
        group.put("total", 0);
        group.put("paid", 0);
        group.put("outstanding", 0);
        group.put("unsettled", 0);
        group.put("lastAt", 0);
        return group;
    }

    private static boolean inPatient(ObjectNode sale) {
        if (!sale.path("patientId").asText("").isBlank()) {
            return true;
        }
        String source = source(sale);
        return "ward".equals(source) || "emergency".equals(source);
    }

    private static String source(ObjectNode sale) {
        if (sale.hasNonNull("source")) {
            return sale.path("source").asText();
        }
        return "online".equals(sale.path("channel").asText()) ? "online" : "counter";
    }
}
