package com.medmate.server.leads.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.shared.web.PageQuery;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class LeadController {

    private final LeadService leads;

    public LeadController(LeadService leads) {
        this.leads = leads;
    }

    @PostMapping("/api/v1/leads")
    public ResponseEntity<?> create(@RequestBody JsonNode body) {
        return leads.create(body);
    }

    @GetMapping("/api/v1/leads")
    public LeadViews.ListResponse list(
            Authentication authentication,
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String site,
            @RequestParam(required = false) String type) {
        return leads.list(principal(authentication), PageQuery.parse(page, size), status, site, type);
    }

    @GetMapping("/api/v1/leads/{id}")
    public LeadViews.One read(Authentication authentication, @PathVariable UUID id) {
        return leads.read(principal(authentication), id);
    }

    @PatchMapping("/api/v1/leads/{id}")
    public LeadViews.One mark(Authentication authentication, @PathVariable UUID id, @RequestBody JsonNode body) {
        return leads.mark(principal(authentication), id, body);
    }

    private static AccountPrincipal principal(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof AccountPrincipal account) {
            return account;
        }
        return null;
    }
}
