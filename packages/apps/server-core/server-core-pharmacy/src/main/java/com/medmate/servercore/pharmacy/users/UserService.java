package com.medmate.servercore.pharmacy.users;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.Permissions;
import com.medmate.servercore.kernel.Plans;
import com.medmate.servercore.pharmacy.store.RowEdits;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final ObjectMapper mapper;

    public UserService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode add(ObjectNode state, JsonNode body) {
        Integer ceiling = Plans.seatCeiling(state.path("subscription").path("plan").asText("Essential"), state.path("extraSeats").asInt(0));
        int active = 0;
        for (JsonNode user : state.withArray("users")) {
            if (!user.has("active") || user.get("active").asBoolean(true)) {
                active++;
            }
        }
        if (ceiling != null && active >= ceiling) {
            throw new ApiError(403, "FORBIDDEN", "Seat limit reached");
        }
        ObjectNode row = body.deepCopy();
        row.put("id", "u" + Nodes.bump(state, "user"));
        row.put("lastActiveMins", 0);
        if (!row.has("permissions") || row.get("permissions").isNull()) {
            ArrayNode permissions = row.putArray("permissions");
            Permissions.ROLE_DEFAULT_PERMS.getOrDefault(row.path("role").asText(), Permissions.ALL_PERM_KEYS).forEach(permissions::add);
        }
        state.withArray("users").add(row);
        return row;
    }

    public ObjectNode update(ObjectNode state, String id, JsonNode patch) {
        return RowEdits.patch(state, "users", id, patch, "User not found");
    }

    public ObjectNode remove(ObjectNode state, String id) {
        RowEdits.remove(state, "users", id);
        return mapper.createObjectNode().set("users", state.get("users"));
    }
}
