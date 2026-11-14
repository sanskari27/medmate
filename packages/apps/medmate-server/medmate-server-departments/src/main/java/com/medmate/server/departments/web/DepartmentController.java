package com.medmate.server.departments.web;

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
public class DepartmentController {

    private final DepartmentService departments;

    public DepartmentController(DepartmentService departments) {
        this.departments = departments;
    }

    @GetMapping("/pharmacy/departments")
    public DepartmentViews.ListResponse list(Authentication authentication) {
        return departments.list(Current.require(authentication));
    }

    @GetMapping("/pharmacy/departments/{id}")
    public DepartmentViews.OneResponse one(Authentication authentication, @PathVariable UUID id) {
        return departments.one(Current.require(authentication), id);
    }

    @PostMapping("/pharmacy/departments")
    public ResponseEntity<DepartmentViews.OneResponse> create(
            Authentication authentication, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(departments.create(Current.require(authentication), body));
    }

    @PatchMapping("/pharmacy/departments/{id}")
    public DepartmentViews.OneResponse update(
            Authentication authentication, @PathVariable UUID id, @RequestBody JsonNode body) {
        return departments.update(Current.require(authentication), id, body);
    }
}
