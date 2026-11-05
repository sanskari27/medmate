package com.medmate.servercore.pharmacy.advisors;

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
@RequestMapping("/api/v1")
public class AdvisorController {
    private final PharmacyGateway gateway;
    private final AdvisorService advisors;

    public AdvisorController(PharmacyGateway gateway, AdvisorService advisors) {
        this.gateway = gateway;
        this.advisors = advisors;
    }

    @GetMapping("/advisors")
    public JsonNode list(HttpServletRequest request) {
        return gateway.read(request, "ca", null, false, (state, session) -> state.get("advisors"));
    }

    @PostMapping("/advisors")
    public JsonNode add(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "ca", null, false, (state, session) -> advisors.add(state, body));
    }

    @PatchMapping("/advisors/{id}")
    public JsonNode update(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "ca", null, false, (state, session) -> advisors.update(state, id, body));
    }

    @PostMapping("/ca/shares")
    public JsonNode share(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "ca", null, false, (state, session) -> advisors.share(state, body == null ? "" : body.path("period").asText(""), body == null ? null : body.get("reports"), body == null ? "" : body.path("advisorId").asText("")));
    }
}
