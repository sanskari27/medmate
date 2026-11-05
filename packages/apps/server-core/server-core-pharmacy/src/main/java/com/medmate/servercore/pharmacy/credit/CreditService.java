package com.medmate.servercore.pharmacy.credit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.InvoiceMath;
import com.medmate.servercore.kernel.Nodes;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CreditService {
    private final ObjectMapper mapper;

    public CreditService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode record(ObjectNode state, JsonNode body) {
        if (body.path("amount").asDouble() <= 0) {
            throw new ApiError(400, "VALIDATION", "Amount must be positive", "amount");
        }
        ObjectNode row = body.deepCopy();
        row.put("id", "CR-" + Nodes.bump(state, "credit"));
        row.put("at", System.currentTimeMillis());
        state.withArray("creditPayments").insert(0, row);
        return row;
    }

    public ArrayNode ledger(ObjectNode state) {
        Map<String, ObjectNode> rows = new LinkedHashMap<>();
        for (JsonNode saleNode : state.withArray("sales")) {
            if (!(saleNode instanceof ObjectNode sale) || "cancelled".equals(sale.path("status").asText()) || !"credit".equals(sale.path("payMode").asText())) {
                continue;
            }
            String key = customerKey(sale.get("customer"));
            if (key.isEmpty()) {
                continue;
            }
            ObjectNode row = rows.computeIfAbsent(key, ignored -> blank(key, sale.path("customer").path("name").asText(key), sale.path("customer").path("phone").asText("")));
            row.put("bills", row.path("bills").asInt() + 1);
            row.put("given", row.path("given").asDouble() + InvoiceMath.payable((ArrayNode) sale.get("items"), sale.path("discount").asDouble()));
            row.put("lastAt", Math.max(row.path("lastAt").asLong(), sale.path("createdAt").asLong()));
            if (!sale.path("customer").path("phone").asText("").isEmpty()) {
                row.put("phone", sale.path("customer").path("phone").asText());
            }
            if (row.path("name").asText().equals(key)) {
                row.put("name", sale.path("customer").path("name").asText(key));
            }
        }
        for (JsonNode paymentNode : state.withArray("creditPayments")) {
            ObjectNode payment = (ObjectNode) paymentNode;
            String key = payment.path("custKey").asText();
            if (key.isEmpty()) {
                continue;
            }
            ObjectNode row = rows.computeIfAbsent(key, ignored -> blank(key, payment.path("custName").asText(key), payment.path("custPhone").asText("")));
            row.put("repaid", row.path("repaid").asDouble() + payment.path("amount").asDouble());
            row.put("lastAt", Math.max(row.path("lastAt").asLong(), payment.path("at").asLong()));
            if (row.path("phone").asText("").isEmpty() && !payment.path("custPhone").asText("").isEmpty()) {
                row.put("phone", payment.path("custPhone").asText());
            }
        }
        ArrayNode list = mapper.createArrayNode();
        rows.values().forEach(row -> {
            row.put("outstanding", Math.max(0, row.path("given").asDouble() - row.path("repaid").asDouble()));
            list.add(row);
        });
        return list;
    }

    private ObjectNode blank(String key, String name, String phone) {
        ObjectNode row = mapper.createObjectNode();
        row.put("key", key);
        row.put("name", name);
        row.put("phone", phone);
        row.put("given", 0);
        row.put("repaid", 0);
        row.put("outstanding", 0);
        row.put("lastAt", 0);
        row.put("bills", 0);
        return row;
    }

    public static String customerKey(JsonNode customer) {
        if (customer == null) {
            return "";
        }
        String phone = customer.path("phone").asText("");
        String name = customer.path("name").asText("");
        return (phone.isEmpty() ? name : phone).trim();
    }
}
