package com.medmate.server.stock.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.web.Current;
import com.medmate.server.shared.web.DayRange;
import com.medmate.server.shared.web.PageQuery;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
public class StockController {

    private final StockService stock;

    public StockController(StockService stock) {
        this.stock = stock;
    }

    @GetMapping("/pharmacy/purchases")
    public StockViews.PurchaseList list(
            Authentication authentication,
            @RequestParam(required = false) String productId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String distributorId,
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size) {
        return stock.list(
                Current.require(authentication),
                productId,
                q,
                DayRange.parse(from, to),
                distributorId,
                PageQuery.parse(page, size));
    }

    @GetMapping("/pharmacy/purchases/{id}")
    public StockViews.PurchaseOne one(Authentication authentication, @PathVariable String id) {
        return stock.one(Current.require(authentication), id);
    }

    @PostMapping("/pharmacy/purchases")
    public ResponseEntity<StockViews.PurchaseOne> create(Authentication authentication, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stock.create(Current.require(authentication), body));
    }

    @PostMapping("/pharmacy/purchases/{id}/returns")
    public ResponseEntity<StockViews.PurchaseOne> createReturn(
            Authentication authentication, @PathVariable String id, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(stock.createReturn(Current.require(authentication), id, body));
    }

    @GetMapping("/pharmacy/inventory")
    public StockViews.InventoryList inventory(
            Authentication authentication,
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String filter) {
        return stock.inventory(Current.require(authentication), PageQuery.parse(page, size), q, filter);
    }

    @GetMapping("/pharmacy/inventory/{productId}")
    public StockViews.InventoryOne inventoryOne(Authentication authentication, @PathVariable String productId) {
        return stock.inventoryOne(Current.require(authentication), productId);
    }

    @PatchMapping("/pharmacy/inventory/{productId}")
    public StockViews.InventoryOne reorder(
            Authentication authentication, @PathVariable String productId, @RequestBody JsonNode body) {
        return stock.reorder(Current.require(authentication), productId, body);
    }

    @GetMapping("/pharmacy/racks")
    public StockViews.RackList racks(Authentication authentication) {
        return stock.racks(Current.require(authentication));
    }

    @PostMapping("/pharmacy/racks")
    public ResponseEntity<StockViews.RackList> createRack(Authentication authentication, @RequestBody JsonNode body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stock.createRack(Current.require(authentication), body));
    }

    @PatchMapping("/pharmacy/inventory/{productId}/location")
    public StockViews.InventoryOne location(
            Authentication authentication, @PathVariable String productId, @RequestBody JsonNode body) {
        return stock.location(Current.require(authentication), productId, body);
    }

    @PostMapping("/pharmacy/inventory/location/bulk")
    public StockViews.RackList bulkLocation(Authentication authentication, @RequestBody JsonNode body) {
        return stock.bulkLocation(Current.require(authentication), body);
    }

    @GetMapping("/pharmacy/medicines/search")
    public StockViews.SearchResponse search(
            Authentication authentication,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String limit) {
        return stock.search(Current.require(authentication), q, limit);
    }

    @PostMapping("/pharmacy/medicines/validate")
    public StockViews.ValidateResponse validate(Authentication authentication, @RequestBody JsonNode body) {
        return stock.validate(Current.require(authentication), body);
    }
}
