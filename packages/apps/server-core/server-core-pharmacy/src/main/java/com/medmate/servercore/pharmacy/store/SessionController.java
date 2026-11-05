package com.medmate.servercore.pharmacy.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import com.medmate.servercore.pharmacy.store.SessionViews;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/session")
public class SessionController {
    private final PharmacyGateway gateway;
    private final SessionViews views;

    public SessionController(PharmacyGateway gateway, SessionViews views) {
        this.gateway = gateway;
        this.views = views;
    }

    @GetMapping
    public JsonNode session(HttpServletRequest request) {
        return gateway.read(request, null, null, false, (state, session) -> views.view(state, session));
    }
}
