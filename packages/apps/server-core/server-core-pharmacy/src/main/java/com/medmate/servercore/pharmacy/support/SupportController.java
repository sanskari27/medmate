package com.medmate.servercore.pharmacy.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/support/tickets")
public class SupportController {
    private final PharmacyGateway gateway;
    private final SupportService support;

    public SupportController(PharmacyGateway gateway, SupportService support) {
        this.gateway = gateway;
        this.support = support;
    }

    @GetMapping
    public JsonNode list(HttpServletRequest request) {
        return gateway.read(request, null, null, false, (state, session) -> state.get("tickets"));
    }

    @PostMapping
    public JsonNode add(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> support.add(state, body == null ? "" : body.path("subject").asText(""), body == null ? "General" : body.path("category").asText("General")));
    }
}
