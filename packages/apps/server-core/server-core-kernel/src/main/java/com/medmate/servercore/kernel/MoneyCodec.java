package com.medmate.servercore.kernel;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Set;

/** API and database money is integer paise. Screen math stays in rupees. */
public final class MoneyCodec {
    private static final Set<String> MONEY_KEYS = Set.of(
            "mrp", "ptr", "price", "amount", "discount", "onlinePrice", "purchasePrice",
            "total", "taxable", "salary", "creditLimit", "approvedAmount", "outstanding",
            "spent", "avgOrder", "given", "repaid", "payable", "reward", "fee", "paid");

    private MoneyCodec() {
    }

    public static JsonNode toPaise(JsonNode node) {
        return convert(node, true);
    }

    public static JsonNode fromPaise(JsonNode node) {
        return convert(node, false);
    }

    public static ObjectNode reportToPaise(ObjectNode report) {
        ArrayNode columns = (ArrayNode) report.get("columns");
        ObjectNode copy = report.deepCopy();
        copy.set("rows", mapRows((ArrayNode) report.get("rows"), columns));
        if (report.has("totals") && report.get("totals").isArray()) {
            copy.set("totals", mapRow((ArrayNode) report.get("totals"), columns));
        }
        return copy;
    }

    private static ArrayNode mapRows(ArrayNode rows, ArrayNode columns) {
        ArrayNode out = JsonNodeFactory.instance.arrayNode();
        if (rows == null) {
            return out;
        }
        for (JsonNode row : rows) {
            out.add(row.isArray() ? mapRow((ArrayNode) row, columns) : row);
        }
        return out;
    }

    private static ArrayNode mapRow(ArrayNode row, ArrayNode columns) {
        ArrayNode out = JsonNodeFactory.instance.arrayNode();
        for (int index = 0; index < row.size(); index++) {
            JsonNode value = row.get(index);
            JsonNode column = columns != null && index < columns.size() ? columns.get(index) : null;
            boolean money = column != null && column.path("money").asBoolean(false);
            if (money && value != null && value.isNumber()) {
                out.add(Math.round(value.asDouble() * 100));
            } else {
                out.add(value);
            }
        }
        return out;
    }

    private static boolean isMoney(String key, ObjectNode object) {
        if (MONEY_KEYS.contains(key)) {
            return true;
        }
        if (!"value".equals(key) || !object.path("value").isNumber()) {
            return false;
        }
        if ("flat".equals(object.path("type").asText()) || "flat".equals(object.path("mode").asText())) {
            return true;
        }
        return object.has("points") && object.has("custKey");
    }

    private static JsonNode convert(JsonNode node, boolean toPaise) {
        if (node == null || node.isNull() || node.isNumber() || node.isBoolean() || node.isTextual()) {
            return node;
        }
        if (node.isArray()) {
            ArrayNode out = JsonNodeFactory.instance.arrayNode();
            node.forEach(item -> out.add(convert(item, toPaise)));
            return out;
        }
        if (!node.isObject()) {
            return node;
        }
        ObjectNode source = (ObjectNode) node;
        ObjectNode out = JsonNodeFactory.instance.objectNode();
        source.fields().forEachRemaining(entry -> {
            JsonNode value = entry.getValue();
            if (value != null && value.isNumber() && isMoney(entry.getKey(), source)) {
                double amount = value.asDouble();
                if (toPaise) {
                    out.put(entry.getKey(), Math.round(amount * 100));
                } else {
                    out.put(entry.getKey(), amount / 100.0);
                }
            } else {
                out.set(entry.getKey(), convert(value, toPaise));
            }
        });
        return out;
    }
}
