package com.medmate.servercore.pharmacy.crm;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/crm")
public class CrmController {
    private final PharmacyGateway gateway;
    private final CrmService crm;

    public CrmController(PharmacyGateway gateway, CrmService crm) {
        this.gateway = gateway;
        this.crm = crm;
    }

    @GetMapping("/patients")
    public JsonNode patients(HttpServletRequest request) {
        return gateway.read(request, "crm", null, false, (state, session) -> crm.list(state));
    }

    @PatchMapping("/patients/{key}")
    public JsonNode meta(HttpServletRequest request, @PathVariable String key, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "crm", null, false, (state, session) -> crm.meta(state, key, body));
    }

    @PostMapping("/campaigns")
    public JsonNode campaigns(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "crm", null, false, (state, session) -> crm.campaign(state, body));
    }

    @PostMapping("/feedback")
    public JsonNode feedback(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "crm", null, false, (state, session) -> crm.feedback(state, body));
    }

    @PostMapping("/reminders")
    public JsonNode reminders(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "crm", null, false, (state, session) -> crm.reminder(state, body));
    }

    @PostMapping("/redemptions")
    public JsonNode redeem(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "crm", null, false, (state, session) -> crm.redeem(state, body.path("custKey").asText(), body.path("custName").asText(""), body.path("points").asDouble()));
    }
}
