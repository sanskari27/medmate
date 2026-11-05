package com.medmate.servercore.pharmacy.advisors;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.pharmacy.store.RowEdits;
import org.springframework.stereotype.Service;

@Service
public class AdvisorService {
    private final ObjectMapper mapper;

    public AdvisorService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode add(ObjectNode state, JsonNode body) {
        ObjectNode row = body.deepCopy();
        row.put("id", "adv" + Nodes.bump(state, "adv"));
        state.withArray("advisors").add(row);
        return row;
    }

    public ObjectNode update(ObjectNode state, String id, JsonNode patch) {
        return RowEdits.patch(state, "advisors", id, patch, "Advisor not found");
    }

    public ObjectNode remove(ObjectNode state, String id) {
        RowEdits.remove(state, "advisors", id);
        return mapper.createObjectNode().set("advisors", state.get("advisors"));
    }

    public ObjectNode share(ObjectNode state, String period, JsonNode reports, String advisorId) {
        ObjectNode advisor = Nodes.findId(state.withArray("advisors"), advisorId);
        if (advisor == null && !state.withArray("advisors").isEmpty()) {
            advisor = (ObjectNode) state.withArray("advisors").get(0);
        }
        if (advisor == null) {
            throw new ApiError(400, "VALIDATION", "Add an advisor first");
        }
        ObjectNode row = mapper.createObjectNode();
        row.put("id", "CA-" + Nodes.bump(state, "ca"));
        row.put("period", period == null ? "" : period);
        row.set("reports", reports == null || !reports.isArray() ? mapper.createArrayNode() : reports.deepCopy());
        row.put("sentTo", advisor.path("email").asText());
        row.put("recipient", advisor.path("name").asText());
        row.put("createdAt", System.currentTimeMillis());
        state.withArray("caShares").insert(0, row);
        return row;
    }
}
