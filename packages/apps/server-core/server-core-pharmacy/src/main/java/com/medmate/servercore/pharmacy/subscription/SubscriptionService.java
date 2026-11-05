package com.medmate.servercore.pharmacy.subscription;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.Plans;
import org.springframework.stereotype.Service;

@Service
public class SubscriptionService {
    public ObjectNode request(ObjectNode state, JsonNode body) {
        String plan = Plans.asPlan(body.path("plan").asText(""));
        if (plan == null) {
            throw new ApiError(400, "VALIDATION", "Choose a plan");
        }
        String cycle = body.path("cycle").asText("");
        if (!"monthly".equals(cycle) && !"annual".equals(cycle)) {
            throw new ApiError(400, "VALIDATION", "Choose a billing cycle");
        }
        ObjectNode row = state.objectNode();
        row.put("id", "REQ-" + Nodes.bump(state, "request"));
        row.put("plan", plan);
        row.put("cycle", cycle);
        row.put("kind", "renewal".equals(body.path("kind").asText()) ? "renewal" : "plan");
        row.put("createdAt", System.currentTimeMillis());
        row.put("status", "open");
        state.withArray("subscriptionRequests").insert(0, row);
        return row;
    }

    public ObjectNode patch(ObjectNode state, JsonNode body) {
        if (body.has("plan") || body.has("grants") || body.has("extraSeats") || body.has("renewsOn") || "renew".equals(body.path("action").asText())) {
            throw new ApiError(403, "FORBIDDEN", "Plan changes are made by Namma MedMate");
        }
        ObjectNode subscription = (ObjectNode) state.get("subscription");
        if (body.has("autoRenew") && body.get("autoRenew").isBoolean()) {
            if ("toggle".equals(body.path("action").asText())) {
                subscription.put("autoRenew", !subscription.path("autoRenew").asBoolean(false));
            } else {
                subscription.put("autoRenew", body.get("autoRenew").asBoolean());
            }
        }
        return subscription;
    }
}
