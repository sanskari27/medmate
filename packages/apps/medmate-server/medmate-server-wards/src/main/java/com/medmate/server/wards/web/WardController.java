package com.medmate.server.wards.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.web.Current;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class WardController {

    private final WardService wards;

    public WardController(WardService wards) {
        this.wards = wards;
    }

    @GetMapping("/pharmacy/wards")
    public WardViews.WardList listWards(Authentication authentication) {
        return wards.listWards(Current.require(authentication));
    }

    @GetMapping("/pharmacy/wards/{id}")
    public WardViews.WardOne oneWard(Authentication authentication, @PathVariable UUID id) {
        return wards.oneWard(Current.require(authentication), id);
    }

    @PostMapping("/pharmacy/wards")
    public ResponseEntity<WardViews.WardOne> createWard(Authentication authentication, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wards.createWard(Current.require(authentication), body));
    }

    @PatchMapping("/pharmacy/wards/{id}")
    public WardViews.WardOne updateWard(
            Authentication authentication, @PathVariable UUID id, @RequestBody JsonNode body) {
        return wards.updateWard(Current.require(authentication), id, body);
    }

    @GetMapping("/pharmacy/admissions")
    public WardViews.AdmissionList listAdmissions(Authentication authentication) {
        return wards.listAdmissions(Current.require(authentication));
    }

    @GetMapping("/pharmacy/admissions/{id}")
    public WardViews.AdmissionOne oneAdmission(Authentication authentication, @PathVariable UUID id) {
        return wards.oneAdmission(Current.require(authentication), id);
    }

    @PostMapping("/pharmacy/admissions")
    public ResponseEntity<WardViews.AdmissionOne> admit(Authentication authentication, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wards.admit(Current.require(authentication), body));
    }

    @PostMapping("/pharmacy/admissions/{id}/transfer")
    public WardViews.AdmissionOne transfer(
            Authentication authentication, @PathVariable UUID id, @RequestBody JsonNode body) {
        return wards.transfer(Current.require(authentication), id, body);
    }

    @PostMapping("/pharmacy/admissions/{id}/discharge")
    public WardViews.AdmissionOne discharge(
            Authentication authentication, @PathVariable UUID id, @RequestBody JsonNode body) {
        return wards.discharge(Current.require(authentication), id, body);
    }
}
