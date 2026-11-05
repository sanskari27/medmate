package com.medmate.servercore.pharmacy.expenses;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.pharmacy.store.RowEdits;
import org.springframework.stereotype.Service;

@Service
public class ExpenseService {
    private final ObjectMapper mapper;

    public ExpenseService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode list(ObjectNode state) {
        ObjectNode response = mapper.createObjectNode();
        response.set("expenses", state.get("expenses"));
        response.set("categories", state.get("expenseCategories"));
        return response;
    }

    public ObjectNode add(ObjectNode state, JsonNode body) {
        ObjectNode row = body.deepCopy();
        String id = "EXP-" + Nodes.bump(state, "exp");
        row.put("id", id);
        row.put("number", id);
        state.withArray("expenses").insert(0, row);
        String category = row.path("category").asText("");
        if (!category.isEmpty() && !contains(state, category)) {
            state.withArray("expenseCategories").add(category);
        }
        ObjectNode response = mapper.createObjectNode();
        response.set("expense", row);
        response.set("categories", state.get("expenseCategories"));
        return response;
    }

    public ObjectNode update(ObjectNode state, String id, JsonNode patch) {
        return RowEdits.patch(state, "expenses", id, patch, "Expense not found");
    }

    public ObjectNode remove(ObjectNode state, String id) {
        RowEdits.remove(state, "expenses", id);
        return mapper.createObjectNode().set("expenses", state.get("expenses"));
    }

    public ObjectNode addCategory(ObjectNode state, String name) {
        String trimmed = name == null ? "" : name.trim();
        if (!trimmed.isEmpty() && !contains(state, trimmed)) {
            state.withArray("expenseCategories").add(trimmed);
        }
        return mapper.createObjectNode().set("categories", state.get("expenseCategories"));
    }

    private static boolean contains(ObjectNode state, String name) {
        for (JsonNode category : state.withArray("expenseCategories")) {
            if (name.equals(category.asText())) {
                return true;
            }
        }
        return false;
    }
}
