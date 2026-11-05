package com.medmate.servercore.pharmacy.racks;

import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.ProfileRules;
import com.medmate.servercore.pharmacy.inventory.InventoryService;
import org.springframework.stereotype.Service;

@Service
public class RackService {
    public ObjectNode create(ObjectNode state, String rack) {
        String code = ProfileRules.normalizeRack(rack);
        if (code.isEmpty()) {
            throw new ApiError(400, "VALIDATION", "Rack code is required", "rack");
        }
        InventoryService.remember(state, code);
        ObjectNode response = state.objectNode();
        response.set("racks", state.get("racks"));
        response.put("created", code);
        return response;
    }

    public ObjectNode remove(ObjectNode state, String rack) {
        String code = ProfileRules.normalizeRack(rack);
        var racks = state.withArray("racks");
        for (int index = racks.size() - 1; index >= 0; index--) {
            if (code.equals(racks.get(index).asText())) {
                racks.remove(index);
            }
        }
        ObjectNode response = state.objectNode();
        response.set("racks", racks);
        return response;
    }
}
