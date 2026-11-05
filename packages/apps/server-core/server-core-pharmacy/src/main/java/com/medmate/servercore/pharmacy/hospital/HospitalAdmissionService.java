package com.medmate.servercore.pharmacy.hospital;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.ProfileRules;
import com.medmate.servercore.pharmacy.store.RowEdits;
import org.springframework.stereotype.Service;

@Service
public class HospitalAdmissionService {
    private final ObjectMapper mapper;

    public HospitalAdmissionService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode addWard(ObjectNode state, JsonNode body) {
        ObjectNode row = body.deepCopy();
        row.put("id", "W-" + Nodes.bump(state, "ward"));
        state.withArray("wards").add(row);
        return row;
    }

    public ObjectNode updateWard(ObjectNode state, String id, JsonNode patch) {
        return RowEdits.patch(state, "wards", id, patch, "Ward not found");
    }

    public ObjectNode removeWard(ObjectNode state, String id) {
        for (JsonNode admission : state.withArray("admissions")) {
            if (id.equals(admission.path("wardId").asText()) && "admitted".equals(admission.path("status").asText())) {
                throw new ApiError(409, "CONFLICT", "Discharge patients before removing this ward");
            }
        }
        RowEdits.remove(state, "wards", id);
        return mapper.createObjectNode().set("wards", state.get("wards"));
    }

    public ObjectNode admit(ObjectNode state, JsonNode body) {
        ObjectNode row = body.deepCopy();
        row.put("id", "ADM-" + Nodes.bump(state, "adm"));
        row.put("admittedAt", System.currentTimeMillis());
        row.put("status", "admitted");
        state.withArray("admissions").insert(0, row);
        return row;
    }

    public ObjectNode updateAdmission(ObjectNode state, String id, JsonNode patch) {
        return RowEdits.patch(state, "admissions", id, patch, "Admission not found");
    }

    public ObjectNode discharge(ObjectNode state, String id) {
        ObjectNode admission = RowEdits.require(state, "admissions", id, "Admission not found");
        admission.put("status", "discharged");
        admission.put("dischargedAt", System.currentTimeMillis());
        return admission;
    }

    public ObjectNode setIndentStatus(ObjectNode state, String id, String status) {
        ObjectNode indent = RowEdits.require(state, "wardIndents", id, "Indent not found");
        indent.put("status", status);
        if ("issued".equals(status)) {
            for (JsonNode item : indent.withArray("items")) {
                if (item instanceof ObjectNode line) {
                    line.put("issued", line.path("qty").asDouble());
                }
            }
        }
        return indent;
    }

    public ObjectNode patchAccount(ObjectNode state, JsonNode patch) {
        if (patch.has("gstin") && patch.get("gstin").isTextual() && !patch.get("gstin").asText().isBlank()
                && !ProfileRules.isValidGstin(patch.get("gstin").asText())) {
            throw new ApiError(400, "VALIDATION", "Enter a valid GSTIN", "gstin");
        }
        ObjectNode account = state.get("hospitalAccount") instanceof ObjectNode existing ? existing : state.putObject("hospitalAccount");
        Nodes.overlay(account, patch);
        return account;
    }
}
