package com.medmate.servercore.pharmacy.offers;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class OfferController {
    private final PharmacyGateway gateway;
    private final OfferService offers;

    public OfferController(PharmacyGateway gateway, OfferService offers) {
        this.gateway = gateway;
        this.offers = offers;
    }

    @GetMapping("/offers")
    public JsonNode list(HttpServletRequest request) {
        return gateway.read(request, "offers", null, false, (state, session) -> state.get("offers"));
    }

    @PostMapping("/offers")
    public JsonNode add(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "offers", null, false, (state, session) -> offers.add(state, body));
    }

    @PostMapping("/offers/{id}/toggle")
    public JsonNode toggle(HttpServletRequest request, @PathVariable String id) {
        return gateway.write(request, "offers", null, false, (state, session) -> offers.toggle(state, id));
    }

    @PutMapping("/inventory/products/{id}/direct-offer")
    public JsonNode direct(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "online", null, false, (state, session) -> offers.direct(state, id, body == null ? "" : body.path("type").asText(), body == null ? 0 : body.path("value").asDouble()));
    }
}
