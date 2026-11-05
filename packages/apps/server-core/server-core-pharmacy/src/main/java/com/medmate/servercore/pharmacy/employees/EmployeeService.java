package com.medmate.servercore.pharmacy.employees;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.ProfileRules;
import com.medmate.servercore.pharmacy.store.RowEdits;
import org.springframework.stereotype.Service;

@Service
public class EmployeeService {
    private final ObjectMapper mapper;

    public EmployeeService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode add(ObjectNode state, JsonNode body) {
        checkIfsc(body);
        ObjectNode row = body.deepCopy();
        row.put("id", "EMP-" + String.format("%03d", Nodes.bump(state, "emp")));
        state.withArray("employees").add(row);
        return row;
    }

    public ObjectNode update(ObjectNode state, String id, JsonNode patch) {
        checkIfsc(patch);
        return RowEdits.patch(state, "employees", id, patch, "Employee not found");
    }

    public ObjectNode remove(ObjectNode state, String id) {
        RowEdits.remove(state, "employees", id);
        return mapper.createObjectNode().set("employees", state.get("employees"));
    }

    private static void checkIfsc(JsonNode body) {
        if (body != null && body.has("ifsc") && body.get("ifsc").isTextual() && !body.get("ifsc").asText().isBlank()
                && !ProfileRules.isValidIfsc(body.get("ifsc").asText())) {
            throw new ApiError(400, "VALIDATION", "Enter a valid IFSC", "ifsc");
        }
    }
}
