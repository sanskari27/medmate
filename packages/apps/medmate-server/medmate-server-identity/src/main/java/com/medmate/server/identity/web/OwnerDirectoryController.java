package com.medmate.server.identity.web;

import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class OwnerDirectoryController {

    private final OwnerDirectoryService owners;

    public OwnerDirectoryController(OwnerDirectoryService owners) {
        this.owners = owners;
    }

    @GetMapping("/pharmacy-owners")
    public List<OwnerDirectoryService.OwnerSummary> list(Authentication authentication) {
        return owners.list(Current.require(authentication));
    }

    @GetMapping("/pharmacy-owners/{id}")
    public OwnerDirectoryService.OwnerDetail detail(Authentication authentication, @PathVariable UUID id) {
        return owners.detail(Current.require(authentication), id);
    }

    @PostMapping("/pharmacy-owners/{id}/block-requests")
    public OwnerDirectoryService.OwnerDetail requestBlock(
            Authentication authentication, @PathVariable UUID id, @RequestBody ReasonRequest request) {
        return owners.requestBlock(Current.require(authentication), id, request.reason());
    }

    @PostMapping("/pharmacy-owners/{id}/block-requests/{requestId}/decision")
    public OwnerDirectoryService.OwnerDetail decide(
            Authentication authentication,
            @PathVariable UUID id,
            @PathVariable UUID requestId,
            @RequestBody DecisionRequest request) {
        return owners.decide(Current.require(authentication), id, requestId, request.decision());
    }

    @PostMapping("/pharmacy-owners/{id}/block")
    public OwnerDirectoryService.OwnerDetail block(Authentication authentication, @PathVariable UUID id) {
        return owners.block(Current.require(authentication), id);
    }

    @PostMapping("/pharmacy-owners/{id}/unblock")
    public OwnerDirectoryService.OwnerDetail unblock(Authentication authentication, @PathVariable UUID id) {
        return owners.unblock(Current.require(authentication), id);
    }

    public record ReasonRequest(String reason) {}

    public record DecisionRequest(String decision) {}
}
