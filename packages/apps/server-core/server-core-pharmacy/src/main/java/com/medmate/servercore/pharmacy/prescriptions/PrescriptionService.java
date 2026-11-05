package com.medmate.servercore.pharmacy.prescriptions;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.pharmacy.store.RowEdits;
import org.springframework.stereotype.Service;

@Service
public class PrescriptionService {
    private final ObjectMapper mapper;

    public PrescriptionService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode approve(ObjectNode state, String id) {
        ObjectNode prescription = RowEdits.require(state, "prescriptions", id, "Prescription not found");
        prescription.put("status", "approved");
        prescription.put("approvedAt", System.currentTimeMillis());
        prescription.put("reviewedBy", reviewer(state));
        return prescription;
    }

    public ObjectNode reject(ObjectNode state, String id, String reason) {
        ObjectNode prescription = RowEdits.require(state, "prescriptions", id, "Prescription not found");
        prescription.put("status", "rejected");
        prescription.put("rejectedAt", System.currentTimeMillis());
        if (reason != null && !reason.isBlank()) {
            prescription.put("rejectReason", reason);
        }
        prescription.put("reviewedBy", reviewer(state));
        return prescription;
    }

    public ObjectNode dispense(ObjectNode state, String id) {
        ObjectNode prescription = RowEdits.require(state, "prescriptions", id, "Prescription not found");
        prescription.put("status", "dispensed");
        prescription.put("dispensedAt", System.currentTimeMillis());
        if (!prescription.has("approvedAt")) {
            prescription.put("approvedAt", System.currentTimeMillis());
        }
        prescription.put("reviewedBy", reviewer(state));
        ObjectNode response = mapper.createObjectNode();
        response.set("prescription", prescription);
        var lines = response.putArray("lines");
        for (JsonNode item : prescription.withArray("items")) {
            lines.addObject().put("productId", item.asText()).put("qty", 1);
        }
        return response;
    }

    private static String reviewer(ObjectNode state) {
        String pharmacist = state.path("profile").path("pharmacist").asText("");
        int comma = pharmacist.indexOf(',');
        return (comma < 0 ? pharmacist : pharmacist.substring(0, comma)).trim();
    }
}
