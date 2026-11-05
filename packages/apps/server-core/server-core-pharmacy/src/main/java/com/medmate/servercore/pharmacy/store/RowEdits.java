package com.medmate.servercore.pharmacy.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;

public final class RowEdits {
    private RowEdits() {
    }

    public static ObjectNode require(ObjectNode state, String field, String id, String missing) {
        ObjectNode row = Nodes.findId(state.withArray(field), id);
        if (row == null) {
            throw new ApiError(404, "NOT_FOUND", missing);
        }
        return row;
    }

    public static ObjectNode patch(ObjectNode state, String field, String id, JsonNode body, String missing) {
        ObjectNode row = require(state, field, id, missing);
        Nodes.overlay(row, body);
        row.put("id", id);
        return row;
    }

    public static void remove(ObjectNode state, String field, String id) {
        Nodes.removeWhere(state.withArray(field), row -> id.equals(row.path("id").asText()));
    }
}
