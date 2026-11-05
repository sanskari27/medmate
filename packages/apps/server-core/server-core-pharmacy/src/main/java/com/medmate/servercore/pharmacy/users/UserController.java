package com.medmate.servercore.pharmacy.users;

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
@RequestMapping("/api/v1/users")
public class UserController {
    private final PharmacyGateway gateway;
    private final UserService users;

    public UserController(PharmacyGateway gateway, UserService users) {
        this.gateway = gateway;
        this.users = users;
    }

    @GetMapping
    public JsonNode list(HttpServletRequest request) {
        return gateway.read(request, null, null, false, (state, session) -> state.get("users"));
    }

    @PostMapping
    public JsonNode add(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, "users", false, (state, session) -> users.add(state, body));
    }

    @PatchMapping("/{id}")
    public JsonNode update(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, "users", false, (state, session) -> users.update(state, id, body));
    }
}
