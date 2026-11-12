package com.medmate.server.offers.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.web.Current;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class OfferController {

    private final OfferService offers;

    public OfferController(OfferService offers) {
        this.offers = offers;
    }

    @GetMapping("/pharmacy/offers")
    public OfferViews.ListResponse list(Authentication authentication) {
        return offers.list(Current.require(authentication));
    }

    @PostMapping("/pharmacy/offers")
    public ResponseEntity<OfferViews.OneResponse> create(Authentication authentication, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(offers.create(Current.require(authentication), body));
    }

    @PatchMapping("/pharmacy/offers/{code}")
    public OfferViews.OneResponse update(
            Authentication authentication, @PathVariable String code, @RequestBody JsonNode body) {
        return offers.update(Current.require(authentication), code, body);
    }

    @DeleteMapping("/pharmacy/offers/{code}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable String code) {
        offers.delete(Current.require(authentication), code);
        return ResponseEntity.noContent().build();
    }
}
