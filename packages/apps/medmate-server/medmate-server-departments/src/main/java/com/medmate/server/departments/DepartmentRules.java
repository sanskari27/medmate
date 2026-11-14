package com.medmate.server.departments;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public final class DepartmentRules {

    public static final String READ = "departments:read";
    public static final String CREATE = "departments:create";
    public static final String UPDATE = "departments:update";
    public static final String DOCTORS_CREATE = "doctors:create";
    public static final String DOCTORS_UPDATE = "doctors:update";

    private static final int NAME_MAX = 100;
    private static final int CODE_MAX = 30;
    private static final int DESCRIPTION_MAX = 4000;

    private DepartmentRules() {}

    public record Values(
            String name, String code, String description, UUID parentId, boolean active, int displayOrder) {}

    public record Prepared(Values values, String problem) {}

    public static Prepared prepareCreate(JsonNode body) {
        if (body == null || !body.isObject()) {
            return fail("Department name is required");
        }
        String nameProblem = nameProblem(body, null, false);
        if (nameProblem != null) {
            return fail(nameProblem);
        }
        String codeProblem = codeProblem(body, false);
        if (codeProblem != null) {
            return fail(codeProblem);
        }
        String descriptionProblem = descriptionProblem(body);
        if (descriptionProblem != null) {
            return fail(descriptionProblem);
        }
        String activeProblem = activeProblem(body);
        if (activeProblem != null) {
            return fail(activeProblem);
        }
        String orderProblem = orderProblem(body);
        if (orderProblem != null) {
            return fail(orderProblem);
        }
        ParentChoice parent = parent(body, null, false);
        if (parent.invalid()) {
            return fail("Parent department was not found");
        }
        return new Prepared(
                new Values(
                        name(body, null, false),
                        code(body, false),
                        description(body, null, false),
                        parent.id(),
                        active(body, true),
                        order(body, 0)),
                null);
    }

    public static Prepared prepareUpdate(JsonNode body, Values current) {
        if (body == null || !body.isObject()) {
            return new Prepared(current, null);
        }
        String nameProblem = nameProblem(body, current.name(), true);
        if (nameProblem != null) {
            return fail(nameProblem);
        }
        String codeProblem = codeProblem(body, true);
        if (codeProblem != null) {
            return fail(codeProblem);
        }
        String descriptionProblem = descriptionProblem(body);
        if (descriptionProblem != null) {
            return fail(descriptionProblem);
        }
        String activeProblem = activeProblem(body);
        if (activeProblem != null) {
            return fail(activeProblem);
        }
        String orderProblem = orderProblem(body);
        if (orderProblem != null) {
            return fail(orderProblem);
        }
        ParentChoice parent = parent(body, current.parentId(), true);
        if (parent.invalid()) {
            return fail("Parent department was not found");
        }
        String nextCode = code(body, true);
        return new Prepared(
                new Values(
                        name(body, current.name(), true),
                        nextCode == null ? current.code() : nextCode,
                        description(body, current.description(), true),
                        parent.id(),
                        active(body, current.active()),
                        order(body, current.displayOrder())),
                null);
    }

    public static String codeKey(String code) {
        return code == null ? "" : code.trim().toLowerCase(Locale.ROOT);
    }

    public static boolean cycle(UUID self, UUID parentId, Map<UUID, UUID> parents) {
        if (parentId == null) {
            return false;
        }
        UUID cursor = parentId;
        Set<UUID> seen = new HashSet<>();
        while (cursor != null) {
            if (cursor.equals(self) || !seen.add(cursor)) {
                return true;
            }
            cursor = parents.get(cursor);
        }
        return false;
    }

    private static Prepared fail(String problem) {
        return new Prepared(null, problem);
    }

    private static String nameProblem(JsonNode body, String current, boolean updating) {
        if (updating && !present(body, "name")) {
            return null;
        }
        String value = text(body, "name");
        if (value.isEmpty()) {
            return "Department name is required";
        }
        if (value.length() > NAME_MAX) {
            return "Department name is too long";
        }
        return null;
    }

    private static String name(JsonNode body, String current, boolean updating) {
        if (updating && !present(body, "name")) {
            return current;
        }
        return text(body, "name");
    }

    private static String codeProblem(JsonNode body, boolean updating) {
        if (updating && !present(body, "code")) {
            return null;
        }
        String value = text(body, "code");
        if (value.isEmpty()) {
            return "Department code is required";
        }
        if (value.length() > CODE_MAX) {
            return "Department code is too long";
        }
        return null;
    }

    private static String code(JsonNode body, boolean updating) {
        if (codeProblem(body, updating) != null) {
            return null;
        }
        if (updating && !present(body, "code")) {
            return null;
        }
        return text(body, "code");
    }

    private static String descriptionProblem(JsonNode body) {
        if (body == null || !body.has("description") || body.get("description").isNull()) {
            return null;
        }
        String value = body.get("description").asText("").trim();
        if (value.length() > DESCRIPTION_MAX) {
            return "Description is too long";
        }
        return null;
    }

    private static String description(JsonNode body, String current, boolean updating) {
        if (body == null || !body.has("description")) {
            return updating ? current : null;
        }
        if (body.get("description").isNull()) {
            return null;
        }
        String value = body.get("description").asText("").trim();
        return value.isEmpty() ? null : value;
    }

    private static String activeProblem(JsonNode body) {
        if (body == null || !body.has("isActive")) {
            return null;
        }
        if (!body.get("isActive").isBoolean()) {
            return "Active flag is not recognised";
        }
        return null;
    }

    private static boolean active(JsonNode body, boolean fallback) {
        if (!present(body, "isActive")) {
            return fallback;
        }
        return body.get("isActive").asBoolean();
    }

    private static String orderProblem(JsonNode body) {
        if (body == null || !body.has("displayOrder")) {
            return null;
        }
        JsonNode node = body.get("displayOrder");
        if (node.isNull() || !node.isIntegralNumber() || !node.canConvertToInt() || node.intValue() < 0) {
            return "Display order is invalid";
        }
        return null;
    }

    private static int order(JsonNode body, int fallback) {
        if (orderProblem(body) != null
                || body == null
                || !body.has("displayOrder")
                || body.get("displayOrder").isNull()) {
            return fallback;
        }
        return body.get("displayOrder").intValue();
    }

    private static ParentChoice parent(JsonNode body, UUID current, boolean updating) {
        if (body == null || !body.has("parentDepartmentId")) {
            return new ParentChoice(updating ? current : null, false);
        }
        JsonNode node = body.get("parentDepartmentId");
        if (node.isNull()) {
            return new ParentChoice(null, false);
        }
        String value = node.asText("").trim();
        if (value.isEmpty()) {
            return new ParentChoice(null, false);
        }
        try {
            return new ParentChoice(UUID.fromString(value), false);
        } catch (IllegalArgumentException exception) {
            return new ParentChoice(null, true);
        }
    }

    private static boolean present(JsonNode body, String field) {
        return body != null && body.has(field) && !body.get(field).isNull();
    }

    private static String text(JsonNode body, String field) {
        if (body == null || !body.has(field) || body.get(field).isNull()) {
            return "";
        }
        return body.get(field).asText().trim();
    }

    private record ParentChoice(UUID id, boolean invalid) {}
}
