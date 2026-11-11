package com.medmate.server.identity.web;

import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class StaffController {

    private final StaffService staff;

    public StaffController(StaffService staff) {
        this.staff = staff;
    }

    @PostMapping("/staff")
    @ResponseStatus(HttpStatus.CREATED)
    public StaffService.StaffResponse createPlatform(Authentication authentication, @RequestBody StaffRequest request) {
        return staff.createPlatform(
                Current.require(authentication), request.phone(), request.displayName(), request.subtypes());
    }

    @PatchMapping("/staff/{id}")
    public StaffService.StaffResponse updatePlatform(
            Authentication authentication, @PathVariable UUID id, @RequestBody StaffRequest request) {
        return staff.updatePlatform(
                Current.require(authentication), id, request.displayName(), request.subtypes(), request.disabled());
    }

    @PostMapping("/pharmacy/staff")
    @ResponseStatus(HttpStatus.CREATED)
    public StaffService.StaffResponse createPharmacy(Authentication authentication, @RequestBody StaffRequest request) {
        return staff.createPharmacy(
                Current.require(authentication), request.phone(), request.displayName(), request.permissions());
    }

    @PatchMapping("/pharmacy/staff/{id}")
    public StaffService.StaffResponse updatePharmacy(
            Authentication authentication, @PathVariable UUID id, @RequestBody StaffRequest request) {
        return staff.updatePharmacy(
                Current.require(authentication), id, request.displayName(), request.permissions(), request.disabled());
    }

    public record StaffRequest(
            String phone, String displayName, List<String> subtypes, List<String> permissions, Boolean disabled) {}
}
