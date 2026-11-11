package com.medmate.server.identity.web;

import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class ReviewController {

    private final ReviewService reviews;

    public ReviewController(ReviewService reviews) {
        this.reviews = reviews;
    }

    @GetMapping("/pharmacy-applications")
    public java.util.List<ReviewService.ApplicationSummary> list(
            Authentication authentication, @RequestParam(required = false) String status) {
        return reviews.list(Current.require(authentication), status).stream()
                .map(ReviewService.ApplicationSummary::from)
                .toList();
    }

    @PostMapping("/pharmacy-applications/{id}/compliance-decision")
    public PharmacyApplicationService.VerificationResponse compliance(
            Authentication authentication, @PathVariable UUID id, @RequestBody DecisionRequest request) {
        return reviews.compliance(Current.require(authentication), id, request.decision(), request.comment());
    }

    @PostMapping("/pharmacy-applications/{id}/admin-decision")
    public PharmacyApplicationService.VerificationResponse admin(
            Authentication authentication, @PathVariable UUID id, @RequestBody DecisionRequest request) {
        return reviews.admin(Current.require(authentication), id, request.decision(), request.comment());
    }

    public record DecisionRequest(String decision, String comment) {}
}
