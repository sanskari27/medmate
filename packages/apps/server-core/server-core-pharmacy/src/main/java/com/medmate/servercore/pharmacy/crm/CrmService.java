package com.medmate.servercore.pharmacy.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import org.springframework.stereotype.Service;

@Service
public class CrmService {
    private final ObjectMapper mapper;
    private final PatientBuilder patients;

    public CrmService(ObjectMapper mapper, PatientBuilder patients) {
        this.mapper = mapper;
        this.patients = patients;
    }

    public ObjectNode list(ObjectNode state) {
        ObjectNode response = mapper.createObjectNode();
        response.set("patients", patients.build(state));
        response.set("crm", state.get("crm"));
        return response;
    }

    public ObjectNode meta(ObjectNode state, String key, JsonNode patch) {
        ObjectNode crm = (ObjectNode) state.get("crm");
        ObjectNode meta = crm.withObject("meta");
        ObjectNode current = meta.withObject(key);
        if (patch != null && patch.isObject()) {
            patch.fields().forEachRemaining(entry -> current.set(entry.getKey(), entry.getValue()));
        }
        return crm;
    }

    public ObjectNode campaign(ObjectNode state, JsonNode body) {
        return prepend(state, "campaigns", "CMP-", body);
    }

    public ObjectNode feedback(ObjectNode state, JsonNode body) {
        return prepend(state, "feedbacks", "FB-", body);
    }

    public ObjectNode reminder(ObjectNode state, JsonNode body) {
        return prepend(state, "reminders", "RM-", body);
    }

    public ObjectNode redeem(ObjectNode state, String customerKey, String customerName, double points) {
        if (points <= 0) {
            throw new ApiError(400, "VALIDATION", "Points must be positive");
        }
        ObjectNode row = mapper.createObjectNode();
        row.put("id", "RD-" + Nodes.bump(state, "crm"));
        row.put("custKey", customerKey);
        row.put("custName", customerName);
        row.put("points", points);
        row.put("value", points);
        row.put("at", System.currentTimeMillis());
        ((ObjectNode) state.get("crm")).withArray("redemptions").insert(0, row);
        return row;
    }

    private ObjectNode prepend(ObjectNode state, String field, String prefix, JsonNode body) {
        ObjectNode row = body.deepCopy();
        row.put("id", prefix + Nodes.bump(state, "crm"));
        row.put(field.equals("campaigns") ? "sentAt" : "at", System.currentTimeMillis());
        ((ObjectNode) state.get("crm")).withArray(field).insert(0, row);
        return row;
    }
}
