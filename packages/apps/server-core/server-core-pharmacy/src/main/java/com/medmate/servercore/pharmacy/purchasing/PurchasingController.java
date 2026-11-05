package com.medmate.servercore.pharmacy.purchasing;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class PurchasingController {
    private final PharmacyGateway gateway;
    private final PurchasingService purchasing;

    public PurchasingController(PharmacyGateway gateway, PurchasingService purchasing) {
        this.gateway = gateway;
        this.purchasing = purchasing;
    }

    @GetMapping("/purchases")
    public JsonNode purchases(HttpServletRequest request) {
        return gateway.read(request, null, null, false, (state, session) -> state.get("purchases"));
    }

    @PostMapping("/purchases/receive")
    public ResponseEntity<JsonNode> receive(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.idempotent(request, null, null, false, (state, session) -> purchasing.receive(state, body));
    }

    @GetMapping("/suppliers")
    public JsonNode suppliers(HttpServletRequest request) {
        return gateway.read(request, "distributors", null, false, (state, session) -> state.get("suppliers"));
    }

    @PostMapping("/suppliers")
    public JsonNode addSupplier(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "distributors", null, false, (state, session) -> purchasing.addSupplier(state, body));
    }

    @PatchMapping("/suppliers/{id}")
    public JsonNode updateSupplier(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "distributors", null, false, (state, session) -> purchasing.updateSupplier(state, id, body));
    }

    @GetMapping("/supply-list")
    public JsonNode supply(HttpServletRequest request) {
        return gateway.read(request, "distributors", null, false, (state, session) -> state.get("supplyList"));
    }

    @PostMapping("/supply-list")
    public JsonNode addSupply(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "distributors", null, false, (state, session) -> purchasing.addSupply(state, body));
    }

    @PatchMapping("/supply-list/{id}")
    public JsonNode updateSupply(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "distributors", null, false, (state, session) -> purchasing.updateSupply(state, id, body));
    }

    @PostMapping("/supply-list/{id}/preferred")
    public JsonNode prefer(HttpServletRequest request, @PathVariable String id) {
        return gateway.write(request, "distributors", null, false, (state, session) -> purchasing.preferSupply(state, id));
    }

    @GetMapping("/purchase-orders")
    public JsonNode orders(HttpServletRequest request) {
        return gateway.read(request, "reorder", null, false, (state, session) -> state.get("purchaseOrders"));
    }

    @PostMapping("/purchase-orders")
    public JsonNode send(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "reorder", null, false, (state, session) -> purchasing.sendOrder(state, body.path("supplierId").asText(), body.path("supplierName").asText(""), body.get("items"), body.has("note") ? body.path("note").asText() : null));
    }

    @PostMapping("/purchase-orders/import")
    public JsonNode importOrders(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "reorder", null, false, (state, session) -> purchasing.importOrders(state, body == null ? null : body.get("rows")));
    }

    @PostMapping("/purchase-orders/{id}/received")
    public JsonNode received(HttpServletRequest request, @PathVariable String id) {
        return gateway.write(request, "reorder", null, false, (state, session) -> purchasing.markReceived(state, id));
    }
}
