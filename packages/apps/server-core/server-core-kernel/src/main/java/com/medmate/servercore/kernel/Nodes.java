package com.medmate.servercore.kernel;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.function.Predicate;

public final class Nodes {
    private Nodes() {
    }

    public static ObjectNode object(JsonNode node, String field) {
        JsonNode child = node == null ? null : node.get(field);
        if (child instanceof ObjectNode object) {
            return object;
        }
        return null;
    }

    public static ArrayNode array(JsonNode node, String field) {
        JsonNode child = node == null ? null : node.get(field);
        if (child instanceof ArrayNode array) {
            return array;
        }
        return null;
    }

    public static ArrayNode ensureArray(ObjectNode node, String field) {
        ArrayNode array = array(node, field);
        if (array == null) {
            array = node.arrayNode();
            node.set(field, array);
        }
        return array;
    }

    public static String text(JsonNode node, String field) {
        if (node == null || node.get(field) == null || node.get(field).isNull()) {
            return "";
        }
        return node.get(field).asText("");
    }

    public static double number(JsonNode node) {
        if (node == null || node.isNull() || !node.isNumber()) {
            return 0;
        }
        return node.asDouble();
    }

    public static double number(JsonNode node, String field) {
        return node == null ? 0 : number(node.get(field));
    }

    public static boolean bool(JsonNode node, String field, boolean fallback) {
        JsonNode value = node == null ? null : node.get(field);
        return value == null || value.isNull() ? fallback : value.asBoolean(fallback);
    }

    public static ObjectNode findId(ArrayNode array, String id) {
        if (array == null) {
            return null;
        }
        for (JsonNode item : array) {
            if (item instanceof ObjectNode object && id.equals(object.path("id").asText())) {
                return object;
            }
        }
        return null;
    }

    public static int indexOfId(ArrayNode array, String id) {
        if (array == null) {
            return -1;
        }
        for (int index = 0; index < array.size(); index++) {
            if (id.equals(array.get(index).path("id").asText())) {
                return index;
            }
        }
        return -1;
    }

    public static void removeWhere(ArrayNode array, Predicate<ObjectNode> predicate) {
        if (array == null) {
            return;
        }
        for (int index = array.size() - 1; index >= 0; index--) {
            if (array.get(index) instanceof ObjectNode object && predicate.test(object)) {
                array.remove(index);
            }
        }
    }

    public static void overlay(ObjectNode target, JsonNode patch) {
        if (patch == null || !patch.isObject()) {
            return;
        }
        patch.fields().forEachRemaining(entry -> target.set(entry.getKey(), entry.getValue().deepCopy()));
    }

    public static List<ObjectNode> objects(ArrayNode array) {
        List<ObjectNode> rows = new ArrayList<>();
        if (array == null) {
            return rows;
        }
        for (JsonNode item : array) {
            if (item instanceof ObjectNode object) {
                rows.add(object);
            }
        }
        return rows;
    }

    public static void sort(ArrayNode array, Comparator<ObjectNode> comparator) {
        List<ObjectNode> rows = objects(array);
        rows.sort(comparator);
        array.removeAll();
        rows.forEach(array::add);
    }

    public static long bump(ObjectNode state, String key) {
        ObjectNode sequence = object(state, "seq");
        long next = sequence.path(key).asLong(0) + 1;
        sequence.put(key, next);
        return next;
    }

    public static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }
}
