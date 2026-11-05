package com.medmate.servercore.pharmacy.subscription;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/subscription")
public class SubscriptionController {
    private final PharmacyGateway gateway;
    private final SubscriptionService subscriptions;

    public SubscriptionController(PharmacyGateway gateway, SubscriptionService subscriptions) {
        this.gateway = gateway;
        this.subscriptions = subscriptions;
    }

    @GetMapping
    public JsonNode current(HttpServletRequest request) {
        return gateway.read(request, null, null, false, (state, session) -> state.get("subscription"));
    }

    @PostMapping("/requests")
    public JsonNode request(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> subscriptions.request(state, body));
    }

    @PatchMapping
    public JsonNode patch(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> subscriptions.patch(state, body));
    }
}
