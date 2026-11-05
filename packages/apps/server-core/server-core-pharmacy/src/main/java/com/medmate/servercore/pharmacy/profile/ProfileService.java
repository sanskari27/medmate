package com.medmate.servercore.pharmacy.profile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.ProfileRules;
import com.medmate.servercore.kernel.ApiError;
import org.springframework.stereotype.Service;

@Service
public class ProfileService {
    public ObjectNode patchProfile(ObjectNode state, JsonNode patch) {
        checkGstin(patch);
        checkPhone(patch);
        ObjectNode profile = (ObjectNode) state.get("profile");
        String phone = profile.path("phone").asText("");
        Nodes.overlay(profile, patch);
        profile.put("gstRegistered", true);
        if (phone.replaceAll("\\D", "").length() >= 10) {
            profile.put("phone", phone);
        }
        return profile;
    }

    public ObjectNode toggleStore(ObjectNode state) {
        ObjectNode profile = (ObjectNode) state.get("profile");
        profile.put("storeOpen", !profile.path("storeOpen").asBoolean(false));
        return profile;
    }

    public ObjectNode patchInvoice(ObjectNode state, JsonNode patch) {
        ObjectNode settings = (ObjectNode) state.get("invoiceSettings");
        Nodes.overlay(settings, patch);
        return settings;
    }

    public ObjectNode patchKiosk(ObjectNode state, JsonNode patch) {
        ObjectNode kiosk = (ObjectNode) state.get("kiosk");
        Nodes.overlay(kiosk, patch);
        return kiosk;
    }

    public ObjectNode completeSetup(ObjectNode state, boolean complete) {
        state.put("setupComplete", complete);
        ObjectNode response = state.objectNode();
        response.put("setupComplete", state.path("setupComplete").asBoolean());
        return response;
    }

    public ObjectNode wipe() {
        throw new ApiError(403, "FORBIDDEN", "Records cannot be deleted");
    }

    private static void checkGstin(JsonNode patch) {
        if (patch != null && patch.has("gstin") && patch.get("gstin").isTextual() && !patch.get("gstin").asText().isBlank()
                && !ProfileRules.isValidGstin(patch.get("gstin").asText())) {
            throw new ApiError(400, "VALIDATION", "Enter a valid GSTIN", "gstin");
        }
    }

    private static void checkPhone(JsonNode patch) {
        if (patch != null && patch.has("phone") && patch.get("phone").isTextual() && !patch.get("phone").asText().isBlank()
                && patch.get("phone").asText().replaceAll("\\D", "").length() < 10) {
            throw new ApiError(400, "VALIDATION", "Enter a valid mobile number", "phone");
        }
    }
}
