package com.medmate.servercore.kernel;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;

public final class ApiBodies {
    private ApiBodies() {
    }

    public static JsonNode encode(JsonNode body) {
        JsonNode expanded = expand(body);
        if (expanded instanceof ObjectNode object && object.has("columns") && object.has("rows")) {
            return MoneyCodec.reportToPaise(object);
        }
        JsonNode converted = MoneyCodec.toPaise(expanded);
        return converted == null ? JsonNodeFactory.instance.nullNode() : converted;
    }

    public static JsonNode expand(JsonNode node) {
        if (node == null || node.isNull()) {
            return node;
        }
        if (node.isTextual()) {
            String value = node.asText();
            if (value.startsWith("file:")) {
                return JsonNodeFactory.instance.textNode("/api/v1/files/" + value.substring(5));
            }
            return node;
        }
        if (node.isArray()) {
            ArrayNode out = JsonNodeFactory.instance.arrayNode();
            node.forEach(item -> out.add(expand(item)));
            return out;
        }
        if (!node.isObject()) {
            return node;
        }
        ObjectNode out = JsonNodeFactory.instance.objectNode();
        node.fields().forEachRemaining(entry -> out.set(entry.getKey(), expand(entry.getValue())));
        return out;
    }
}
