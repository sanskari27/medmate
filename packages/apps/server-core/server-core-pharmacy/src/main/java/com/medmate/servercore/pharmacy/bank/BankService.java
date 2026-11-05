package com.medmate.servercore.pharmacy.bank;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Plans;
import com.medmate.servercore.kernel.ProfileRules;
import org.springframework.stereotype.Service;

@Service
public class BankService {
    private final ObjectMapper mapper;

    public BankService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode view(ObjectNode state) {
        ObjectNode response = mapper.createObjectNode();
        if (state.has("bankAccount") && !state.get("bankAccount").isNull()) {
            response.set("bankAccount", state.get("bankAccount"));
        } else {
            response.putNull("bankAccount");
        }
        return response;
    }

    public ObjectNode save(ObjectNode state, JsonNode body) {
        if (!ProfileRules.isValidIfsc(body.path("ifsc").asText(""))) {
            throw new ApiError(400, "VALIDATION", "Enter a valid IFSC", "ifsc");
        }
        ObjectNode account = body.deepCopy();
        account.put("ifsc", body.path("ifsc").asText().trim().toUpperCase());
        account.put("verified", false);
        account.put("addedOn", Plans.todayIso());
        state.set("bankAccount", account);
        return account;
    }

    public ObjectNode verify(ObjectNode state) {
        if (!(state.get("bankAccount") instanceof ObjectNode account)) {
            throw new ApiError(404, "NOT_FOUND", "No bank account");
        }
        account.put("verified", true);
        return account;
    }

    public ObjectNode remove(ObjectNode state) {
        state.putNull("bankAccount");
        return view(state);
    }
}
