package com.medmate.servercore.pharmacy.prescriptions;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/prescriptions")
public class PrescriptionController {
    private final PharmacyGateway gateway;
    private final PrescriptionService prescriptions;

    public PrescriptionController(PharmacyGateway gateway, PrescriptionService prescriptions) {
        this.gateway = gateway;
        this.prescriptions = prescriptions;
    }

    @GetMapping
    public JsonNode list(HttpServletRequest request) {
        return gateway.read(request, "prescriptions", null, false, (state, session) -> state.get("prescriptions"));
    }

    @PostMapping("/{id}/approve")
    public JsonNode approve(HttpServletRequest request, @PathVariable String id) {
        return gateway.write(request, "prescriptions", null, false, (state, session) -> prescriptions.approve(state, id));
    }

    @PostMapping("/{id}/reject")
    public JsonNode reject(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "prescriptions", null, false, (state, session) -> prescriptions.reject(state, id, body == null ? null : body.path("reason").asText(null)));
    }

    @PostMapping("/{id}/dispense")
    public JsonNode dispense(HttpServletRequest request, @PathVariable String id) {
        return gateway.write(request, "prescriptions", null, false, (state, session) -> prescriptions.dispense(state, id));
    }
}
