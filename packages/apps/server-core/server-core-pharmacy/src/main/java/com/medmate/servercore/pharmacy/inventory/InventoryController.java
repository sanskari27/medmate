package com.medmate.servercore.pharmacy.inventory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.NullNode;
import com.medmate.servercore.pharmacy.store.AccessGuard;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {
    private final PharmacyGateway gateway;
    private final InventoryService inventory;

    public InventoryController(PharmacyGateway gateway, InventoryService inventory) {
        this.gateway = gateway;
        this.inventory = inventory;
    }

    @GetMapping
    public JsonNode list(HttpServletRequest request) {
        return gateway.read(request, null, null, false, (state, session) -> state.get("inventory"));
    }

    @PostMapping("/products")
    public JsonNode add(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> inventory.addProduct(state, body));
    }

    @PostMapping("/import")
    public JsonNode importProducts(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> inventory.importProducts(state, body == null ? null : body.get("products")));
    }

    @PatchMapping("/products/{id}")
    public JsonNode update(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> inventory.updateProduct(state, id, body));
    }

    @PostMapping("/products/{id}/batches")
    public JsonNode batch(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> inventory.addBatch(state, id, body));
    }

    @PatchMapping("/products/{id}/batches/{batchNo}")
    public org.springframework.http.ResponseEntity<JsonNode> quantity(HttpServletRequest request, @PathVariable String id, @PathVariable String batchNo, @RequestBody(required = false) JsonNode body) {
        return gateway.idempotent(request, null, null, false, (state, session) -> inventory.setBatchQuantity(state, id, batchNo, body == null ? 0 : body.path("qty").asDouble()));
    }

    @PostMapping("/products/{id}/online")
    public JsonNode online(HttpServletRequest request, @PathVariable String id) {
        return gateway.write(request, null, null, false, (state, session) -> inventory.toggleOnline(state, id));
    }

    @PostMapping("/products/{id}/loose")
    public JsonNode loose(HttpServletRequest request, @PathVariable String id) {
        return gateway.write(request, null, null, false, (state, session) -> inventory.toggleLoose(state, id));
    }

    @PatchMapping("/products/{id}/online-price")
    public JsonNode price(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "online", null, false, (state, session) -> inventory.setOnlinePrice(state, id, body == null ? null : body.get("price")));
    }

    @PatchMapping("/products/{id}/offer")
    public JsonNode offer(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "offers", null, false, (state, session) -> inventory.setOffer(state, id, body == null ? null : body.get("offerId")));
    }

    @PatchMapping("/products/{id}/supplier")
    public JsonNode supplier(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "distributors", null, false, (state, session) -> inventory.setSupplier(state, id, body == null ? "" : body.path("supplierId").asText("")));
    }

    @PatchMapping("/products/{id}/location")
    public JsonNode location(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "rackmap", null, false, (state, session) -> inventory.setLocation(state, id, body == null ? "" : body.path("rack").asText(""), body == null || !body.has("rackAlt") ? null : body.path("rackAlt").asText()));
    }

    @PostMapping("/location/bulk")
    public JsonNode bulk(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "rackmap", null, false, (state, session) -> inventory.bulkLocation(state, body == null ? null : body.get("ids"), body == null ? "" : body.path("rack").asText("")));
    }

    @PostMapping("/loose-default")
    public JsonNode looseDefault(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> inventory.setLooseDefault(state, body != null && body.path("allowed").asBoolean(false)));
    }

    @GetMapping("/scan")
    public JsonNode scan(HttpServletRequest request, @RequestParam(name = "q", required = false) String query) {
        return gateway.read(request, null, null, false, (state, session) -> {
            AccessGuard.requirePlan(state, "pos");
            JsonNode hit = inventory.scan(state, query);
            return hit == null ? NullNode.getInstance() : hit;
        });
    }
}
