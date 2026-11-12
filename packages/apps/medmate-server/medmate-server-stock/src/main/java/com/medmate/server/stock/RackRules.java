package com.medmate.server.stock;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public final class RackRules {

    public static final String READ = "racks:read";
    public static final String CREATE = "racks:create";
    public static final String UPDATE = "racks:update";
    public static final String EXPORT = "racks:export";
    public static final int MAX_IDS = 200;

    private RackRules() {}

    public record Code(String value, String problem) {

        static Code problem(String detail) {
            return new Code(null, detail);
        }
    }

    public record Placement(String rack, String rackAlt) {}

    public record Change(Placement placement, String problem) {

        static Change problem(String detail) {
            return new Change(null, detail);
        }
    }

    public record IdList(List<String> ids, String problem) {

        static IdList problem(String detail) {
            return new IdList(List.of(), detail);
        }
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }

    public static Code required(String raw) {
        String code = normalize(raw);
        if (code.isEmpty()) {
            return Code.problem("Rack code is required");
        }
        return new Code(code, null);
    }

    public static Code requiredRack(JsonNode body) {
        if (body == null
                || !body.isObject()
                || !body.has("rack")
                || !body.get("rack").isTextual()) {
            return Code.problem("Rack code is required");
        }
        return required(body.get("rack").asText());
    }

    public static boolean taken(String code, List<String> registry) {
        return registry != null && registry.contains(code);
    }

    public static Change location(JsonNode body, Placement current) {
        if (body == null || !body.isObject()) {
            return Change.problem("Rack code is required");
        }
        String rack = current.rack();
        String alt = current.rackAlt();
        if (body.has("rack")) {
            String parsed = optional(body.get("rack"));
            if (parsed == null && refused(body.get("rack"))) {
                return Change.problem("Rack code is required");
            }
            rack = parsed;
        }
        if (body.has("rackAlt")) {
            String parsed = optional(body.get("rackAlt"));
            if (parsed == null && refused(body.get("rackAlt"))) {
                return Change.problem("Rack code is required");
            }
            alt = parsed;
        }
        return new Change(new Placement(rack, alt), null);
    }

    public static Placement assignPrimary(Placement current, String rack) {
        return new Placement(rack, current.rackAlt());
    }

    public static IdList ids(JsonNode body) {
        if (body == null
                || !body.isObject()
                || !body.has("ids")
                || !body.get("ids").isArray()) {
            return IdList.problem("Product is required");
        }
        List<String> ids = new ArrayList<>();
        for (JsonNode node : body.get("ids")) {
            if (!node.isTextual()) {
                return IdList.problem("Product is required");
            }
            String id = node.asText().trim();
            if (id.isEmpty()) {
                return IdList.problem("Product is required");
            }
            if (!ids.contains(id)) {
                ids.add(id);
            }
        }
        if (ids.isEmpty()) {
            return IdList.problem("Product is required");
        }
        if (ids.size() > MAX_IDS) {
            return IdList.problem("A location can be set on at most 200 products");
        }
        return new IdList(ids, null);
    }

    private static String optional(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (!node.isTextual()) {
            return null;
        }
        String code = normalize(node.asText());
        return code.isEmpty() ? null : code;
    }

    private static boolean refused(JsonNode node) {
        return node != null && !node.isNull() && !node.isTextual();
    }
}
