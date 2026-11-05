package com.medmate.servercore.pharmacy.customers;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {
    private final PharmacyGateway gateway;
    private final CustomerService customers;

    public CustomerController(PharmacyGateway gateway, CustomerService customers) {
        this.gateway = gateway;
        this.customers = customers;
    }

    @GetMapping
    public JsonNode list(HttpServletRequest request) {
        return gateway.read(request, "customers", null, false, (state, session) -> customers.aggregate(state));
    }
}
