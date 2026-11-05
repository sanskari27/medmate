package com.medmate.servercore.pharmacy.credit;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/credit")
public class CreditController {
    private final PharmacyGateway gateway;
    private final CreditService credit;

    public CreditController(PharmacyGateway gateway, CreditService credit) {
        this.gateway = gateway;
        this.credit = credit;
    }

    @GetMapping("/ledger")
    public JsonNode ledger(HttpServletRequest request) {
        return gateway.read(request, "khata", null, false, (state, session) -> credit.ledger(state));
    }

    @PostMapping("/payments")
    public JsonNode pay(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "khata", null, false, (state, session) -> credit.record(state, body));
    }
}
