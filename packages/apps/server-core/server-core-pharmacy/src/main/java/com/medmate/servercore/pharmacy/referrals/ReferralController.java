package com.medmate.servercore.pharmacy.referrals;

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
@RequestMapping("/api/v1/referrals")
public class ReferralController {
    private final PharmacyGateway gateway;
    private final ReferralService referrals;

    public ReferralController(PharmacyGateway gateway, ReferralService referrals) {
        this.gateway = gateway;
        this.referrals = referrals;
    }

    @GetMapping
    public JsonNode list(HttpServletRequest request) {
        return gateway.read(request, null, null, false, (state, session) -> state.has("referrals") && !state.get("referrals").isNull() ? state.get("referrals") : state.arrayNode());
    }

    @PostMapping
    public JsonNode add(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> referrals.add(state, body));
    }

    @PatchMapping("/{id}")
    public JsonNode update(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> referrals.update(state, id, body));
    }
}
