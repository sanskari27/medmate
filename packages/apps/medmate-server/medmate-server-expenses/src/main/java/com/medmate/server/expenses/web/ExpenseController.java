package com.medmate.server.expenses.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.web.Current;
import com.medmate.server.shared.web.PageQuery;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class ExpenseController {

    private final ExpenseService expenses;

    public ExpenseController(ExpenseService expenses) {
        this.expenses = expenses;
    }

    @GetMapping("/pharmacy/expenses")
    public ExpenseViews.ListResponse list(
            Authentication authentication,
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q) {
        return expenses.list(Current.require(authentication), PageQuery.parse(page, size), from, to, category, q);
    }

    @GetMapping("/pharmacy/expenses/export")
    public ExpenseViews.ExportResponse export(
            Authentication authentication,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q) {
        return expenses.export(Current.require(authentication), from, to, category, q);
    }

    @PostMapping("/pharmacy/expenses")
    public ResponseEntity<ExpenseViews.OneResponse> create(Authentication authentication, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenses.create(Current.require(authentication), body));
    }
}
