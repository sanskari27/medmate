package com.medmate.servercore.pharmacy.bank;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bank-account")
public class BankController {
    private final PharmacyGateway gateway;
    private final BankService bank;

    public BankController(PharmacyGateway gateway, BankService bank) {
        this.gateway = gateway;
        this.bank = bank;
    }

    @GetMapping
    public JsonNode current(HttpServletRequest request) {
        return gateway.read(request, null, null, false, (state, session) -> bank.view(state));
    }

    @PutMapping
    public JsonNode save(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> bank.save(state, body));
    }

    @PostMapping("/verify")
    public JsonNode verify(HttpServletRequest request) {
        return gateway.write(request, null, null, false, (state, session) -> bank.verify(state));
    }
}
