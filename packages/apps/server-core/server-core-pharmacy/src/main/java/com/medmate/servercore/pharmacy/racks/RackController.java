package com.medmate.servercore.pharmacy.racks;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/racks")
public class RackController {
    private final PharmacyGateway gateway;
    private final RackService racks;

    public RackController(PharmacyGateway gateway, RackService racks) {
        this.gateway = gateway;
        this.racks = racks;
    }

    @GetMapping
    public JsonNode list(HttpServletRequest request) {
        return gateway.read(request, "rackmap", null, false, (state, session) -> state.get("racks"));
    }

    @PostMapping
    public JsonNode create(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        String code = body == null ? "" : body.path("rack").asText(body.path("code").asText(""));
        return gateway.write(request, "rackmap", null, false, (state, session) -> racks.create(state, code));
    }
}
