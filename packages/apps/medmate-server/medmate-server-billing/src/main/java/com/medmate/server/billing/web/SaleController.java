package com.medmate.server.billing.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.web.Current;
import com.medmate.server.shared.web.PageQuery;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class SaleController {

    private final SaleService sales;

    public SaleController(SaleService sales) {
        this.sales = sales;
    }

    @GetMapping("/pharmacy/sales")
    public SaleViews.ListResponse list(
            Authentication authentication,
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String q) {
        return sales.list(Current.require(authentication), PageQuery.parse(page, size), q);
    }

    @GetMapping("/pharmacy/sales/{id}")
    public SaleViews.OneResponse read(Authentication authentication, @PathVariable String id) {
        return sales.read(Current.require(authentication), id);
    }

    @PostMapping("/pharmacy/sales/{invoiceNumber}/returns")
    public ResponseEntity<SaleViews.OneResponse> createReturn(
            Authentication authentication, @PathVariable String invoiceNumber, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sales.createReturn(Current.require(authentication), invoiceNumber, body));
    }
}
