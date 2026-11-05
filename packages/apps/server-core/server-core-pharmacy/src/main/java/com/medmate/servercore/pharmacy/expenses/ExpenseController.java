package com.medmate.servercore.pharmacy.expenses;

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
@RequestMapping("/api/v1")
public class ExpenseController {
    private final PharmacyGateway gateway;
    private final ExpenseService expenses;

    public ExpenseController(PharmacyGateway gateway, ExpenseService expenses) {
        this.gateway = gateway;
        this.expenses = expenses;
    }

    @GetMapping("/expenses")
    public JsonNode list(HttpServletRequest request) {
        return gateway.read(request, "expenses", null, false, (state, session) -> expenses.list(state));
    }

    @PostMapping("/expenses")
    public JsonNode add(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "expenses", "reports", false, (state, session) -> expenses.add(state, body));
    }

    @PatchMapping("/expenses/{id}")
    public JsonNode update(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "expenses", "reports", false, (state, session) -> expenses.update(state, id, body));
    }

    @PostMapping("/expense-categories")
    public JsonNode category(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "expenses", "reports", false, (state, session) -> expenses.addCategory(state, body == null ? "" : body.path("name").asText("")));
    }
}
