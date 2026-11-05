package com.medmate.servercore.pharmacy.employees;

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
@RequestMapping("/api/v1/employees")
public class EmployeeController {
    private final PharmacyGateway gateway;
    private final EmployeeService employees;

    public EmployeeController(PharmacyGateway gateway, EmployeeService employees) {
        this.gateway = gateway;
        this.employees = employees;
    }

    @GetMapping
    public JsonNode list(HttpServletRequest request) {
        return gateway.read(request, "employees", null, false, (state, session) -> state.get("employees"));
    }

    @PostMapping
    public JsonNode add(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "employees", "employees", false, (state, session) -> employees.add(state, body));
    }

    @PatchMapping("/{id}")
    public JsonNode update(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "employees", "employees", false, (state, session) -> employees.update(state, id, body));
    }
}
