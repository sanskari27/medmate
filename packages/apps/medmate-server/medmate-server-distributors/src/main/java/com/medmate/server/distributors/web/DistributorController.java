package com.medmate.server.distributors.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.web.Current;
import com.medmate.server.shared.web.DayRange;
import com.medmate.server.shared.web.PageQuery;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
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
public class DistributorController {

    private final DistributorService distributors;

    public DistributorController(DistributorService distributors) {
        this.distributors = distributors;
    }

    @GetMapping("/pharmacy/distributors")
    public DistributorViews.ListResponse list(Authentication authentication) {
        return distributors.list(Current.require(authentication));
    }

    @GetMapping("/pharmacy/distributors/{code}")
    public DistributorViews.OneResponse one(Authentication authentication, @PathVariable String code) {
        return distributors.one(Current.require(authentication), code);
    }

    @PostMapping("/pharmacy/distributors")
    public ResponseEntity<DistributorViews.OneResponse> create(
            Authentication authentication, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(distributors.create(Current.require(authentication), body));
    }

    @PatchMapping("/pharmacy/distributors/{code}")
    public DistributorViews.OneResponse update(
            Authentication authentication, @PathVariable String code, @RequestBody JsonNode body) {
        return distributors.update(Current.require(authentication), code, body);
    }

    @GetMapping("/pharmacy/distributors/{code}/payments")
    public DistributorViews.PaymentList payments(
            Authentication authentication,
            @PathVariable String code,
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        return distributors.payments(
                Current.require(authentication), code, PageQuery.parse(page, size), DayRange.parse(from, to));
    }

    @PostMapping("/pharmacy/distributors/{code}/payments")
    public DistributorViews.OneResponse pay(
            Authentication authentication, @PathVariable String code, @RequestBody JsonNode body) {
        return distributors.pay(Current.require(authentication), code, body);
    }
}
