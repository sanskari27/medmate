package com.medmate.servercore.pharmacy.referrals;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.pharmacy.store.RowEdits;
import org.springframework.stereotype.Service;

@Service
public class ReferralService {
    private final ObjectMapper mapper;

    public ReferralService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode add(ObjectNode state, JsonNode body) {
        String name = body.path("name").asText("").trim();
        if (name.isEmpty()) {
            throw new ApiError(400, "VALIDATION", "Enter a pharmacy name");
        }
        ObjectNode row = mapper.createObjectNode();
        row.put("id", "REF-" + Nodes.bump(state, "referral"));
        row.put("name", name);
        row.put("area", body.path("area").asText("").trim());
        row.put("status", "Invited");
        row.put("reward", 0);
        state.withArray("referrals").insert(0, row);
        return row;
    }

    public ObjectNode update(ObjectNode state, String id, JsonNode patch) {
        ObjectNode previous = RowEdits.require(state, "referrals", id, "Referral not found");
        if ("Paid".equals(previous.path("status").asText())) {
            throw new ApiError(403, "FORBIDDEN", "A paid referral cannot be changed");
        }
        if ("Paid".equals(patch.path("status").asText())) {
            throw new ApiError(403, "FORBIDDEN", "Only Namma MedMate can mark a referral paid");
        }
        String status = patch.path("status").asText();
        if (!"Signed up".equals(status) && !"Earned".equals(status) && !"Invited".equals(status)) {
            status = previous.path("status").asText();
        }
        double reward = patch.has("reward") && patch.get("reward").isNumber() ? Math.max(0, patch.get("reward").asDouble()) : previous.path("reward").asDouble();
        String name = patch.has("name") ? patch.path("name").asText("").trim() : previous.path("name").asText();
        if (name.isEmpty()) {
            name = previous.path("name").asText();
        }
        String area = patch.has("area") ? patch.path("area").asText("").trim() : previous.path("area").asText();
        previous.put("name", name);
        previous.put("area", area);
        previous.put("status", status);
        previous.put("reward", reward);
        previous.put("id", id);
        return previous;
    }

    public ObjectNode remove(ObjectNode state, String id) {
        ObjectNode previous = Nodes.findId(state.withArray("referrals"), id);
        if (previous != null && "Paid".equals(previous.path("status").asText())) {
            throw new ApiError(403, "FORBIDDEN", "A paid referral cannot be changed");
        }
        RowEdits.remove(state, "referrals", id);
        return mapper.createObjectNode().set("referrals", state.get("referrals"));
    }
}
