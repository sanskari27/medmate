package com.medmate.server.prep.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.access.AccountPrincipal;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class PrepController {

    private final PrepService lists;

    public PrepController(PrepService lists) {
        this.lists = lists;
    }

    @PostMapping("/api/v1/inventory-prep")
    public ResponseEntity<PrepViews.Created> create(Authentication authentication, @RequestBody JsonNode body) {
        return ResponseEntity.status(201).body(lists.create(principal(authentication), body));
    }

    @GetMapping("/api/v1/inventory-prep")
    public PrepViews.Listed list(Authentication authentication) {
        return lists.list(principal(authentication));
    }

    @GetMapping("/api/v1/inventory-prep/{id}")
    public PrepViews.One read(Authentication authentication, @PathVariable UUID id) {
        return lists.read(principal(authentication), id);
    }

    @PatchMapping("/api/v1/inventory-prep/{id}")
    public PrepViews.Created rename(Authentication authentication, @PathVariable UUID id, @RequestBody JsonNode body) {
        return lists.rename(principal(authentication), id, body);
    }

    @PutMapping("/api/v1/inventory-prep/{id}/lines")
    public PrepViews.One replace(Authentication authentication, @PathVariable UUID id, @RequestBody JsonNode body) {
        return lists.replace(principal(authentication), id, body);
    }

    @DeleteMapping("/api/v1/inventory-prep/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID id) {
        lists.delete(principal(authentication), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/inventory-prep/{id}/export")
    public ResponseEntity<String> export(Authentication authentication, @PathVariable UUID id) {
        return lists.export(principal(authentication), id);
    }

    private static AccountPrincipal principal(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof AccountPrincipal account) {
            return account;
        }
        return null;
    }
}
