package com.medmate.servercore.pharmacy.customers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.InvoiceMath;
import com.medmate.servercore.pharmacy.credit.CreditService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CustomerService {
    private final ObjectMapper mapper;

    public CustomerService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ArrayNode aggregate(ObjectNode state) {
        Map<String, ObjectNode> rows = new LinkedHashMap<>();
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
            ObjectNode row = rows.computeIfAbsent(key, ignored -> {
                ObjectNode created = mapper.createObjectNode();
                created.put("name", name);
                created.put("phone", sale.path("customer").path("phone").asText("—"));
                created.put("orders", 0);
                created.put("units", 0);
                created.put("online", 0);
                created.put("offline", 0);
                created.put("spent", 0);
                created.put("last", 0);
                created.put("rx", false);
                return created;
            });
            row.put("orders", row.path("orders").asInt() + 1);
            row.put("spent", row.path("spent").asDouble() + InvoiceMath.payable((ArrayNode) sale.get("items"), sale.path("discount").asDouble()));
            double units = 0;
            for (JsonNode item : sale.withArray("items")) {
                units += item.path("qty").asDouble();
            }
            row.put("units", row.path("units").asDouble() + units);
            if ("online".equals(sale.path("channel").asText())) {
                row.put("online", row.path("online").asInt() + 1);
            } else {
                row.put("offline", row.path("offline").asInt() + 1);
            }
            row.put("last", Math.max(row.path("last").asLong(), sale.path("createdAt").asLong()));
            row.put("rx", row.path("rx").asBoolean() || sale.path("rx").asBoolean());
            if (!sale.path("customer").path("phone").asText("").isEmpty()) {
                row.put("phone", sale.path("customer").path("phone").asText());
            }
        }
        ArrayNode list = mapper.createArrayNode();
        rows.values().stream().sorted((left, right) -> Double.compare(right.path("spent").asDouble(), left.path("spent").asDouble())).forEach(list::add);
        return list;
    }
}
