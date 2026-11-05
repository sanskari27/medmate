package com.medmate.servercore.pharmacy.hospital;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.pharmacy.store.RowEdits;
import org.springframework.stereotype.Service;

@Service
public class HospitalDirectoryService {
    private final ObjectMapper mapper;

    public HospitalDirectoryService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode addDepartment(ObjectNode state, JsonNode body) {
        String name = body.path("name").asText("").trim();
        if (name.isEmpty()) {
            throw new ApiError(400, "VALIDATION", "Enter a department name");
        }
        String type = body.path("type").asText("");
        if (!"IPD".equals(type) && !"Diagnostic".equals(type) && !"Support".equals(type)) {
            type = "OPD";
        }
        ObjectNode row = mapper.createObjectNode();
        row.put("id", "DEP-" + Nodes.bump(state, "dept"));
        row.put("name", name);
        row.put("head", body.path("head").asText("").trim());
        row.put("type", type);
        row.putArray("doctors");
        state.withArray("departments").insert(0, row);
        return row;
    }

    public ObjectNode updateDepartment(ObjectNode state, String id, JsonNode patch) {
        ObjectNode previous = RowEdits.require(state, "departments", id, "Department not found");
        String name = patch.has("name") ? patch.path("name").asText("").trim() : previous.path("name").asText();
        if (name.isEmpty()) {
            throw new ApiError(400, "VALIDATION", "Enter a department name");
        }
        if (!name.equals(previous.path("name").asText())) {
            for (JsonNode node : state.withArray("doctors")) {
                if (node instanceof ObjectNode doctor && previous.path("name").asText().equals(doctor.path("department").asText())) {
                    doctor.put("department", name);
                }
            }
        }
        String type = patch.path("type").asText();
        if (!"IPD".equals(type) && !"Diagnostic".equals(type) && !"Support".equals(type) && !"OPD".equals(type)) {
            type = previous.path("type").asText();
        }
        Nodes.overlay(previous, patch);
        previous.put("id", id);
        previous.put("name", name);
        previous.put("type", type);
        previous.putArray("doctors");
        return previous;
    }

    public ObjectNode removeDepartment(ObjectNode state, String id) {
        RowEdits.remove(state, "departments", id);
        return mapper.createObjectNode().set("departments", state.get("departments"));
    }

    public ObjectNode addDoctor(ObjectNode state, JsonNode body) {
        ObjectNode row = body.deepCopy();
        row.put("id", "DR-" + String.format("%03d", Nodes.bump(state, "doc")));
        state.withArray("doctors").insert(0, row);
        return row;
    }

    public ObjectNode updateDoctor(ObjectNode state, String id, JsonNode patch) {
        return RowEdits.patch(state, "doctors", id, patch, "Doctor not found");
    }

    public ObjectNode removeDoctor(ObjectNode state, String id) {
        RowEdits.remove(state, "doctors", id);
        return mapper.createObjectNode().set("doctors", state.get("doctors"));
    }

    public ObjectNode setClaim(ObjectNode state, String id, String status, JsonNode approvedAmount) {
        ObjectNode claim = RowEdits.require(state, "tpaClaims", id, "Claim not found");
        claim.put("status", status);
        if (approvedAmount != null && !approvedAmount.isNull()) {
            claim.set("approvedAmount", approvedAmount);
        }
        return claim;
    }
}
