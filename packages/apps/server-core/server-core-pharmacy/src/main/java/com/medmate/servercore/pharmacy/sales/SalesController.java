package com.medmate.servercore.pharmacy.sales;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class SalesController {
    private final PharmacyGateway gateway;
    private final SalesService sales;
    private final CheckoutService checkout;

    public SalesController(PharmacyGateway gateway, SalesService sales, CheckoutService checkout) {
        this.gateway = gateway;
        this.sales = sales;
        this.checkout = checkout;
    }

    @GetMapping("/sales")
    public JsonNode list(HttpServletRequest request, @RequestParam(required = false) String channel, @RequestParam(required = false) String status) {
        return gateway.read(request, null, null, false, (state, session) -> sales.filter(state, channel, status));
    }

    @GetMapping("/sales/{id}")
    public JsonNode one(HttpServletRequest request, @PathVariable String id) {
        return gateway.read(request, null, null, false, (state, session) -> sales.one(state, id));
    }

    @GetMapping("/sales/{id}/invoice.pdf")
    public ResponseEntity<byte[]> pdf(HttpServletRequest request, @PathVariable String id) {
        var session = gateway.require(request);
        var state = gateway.store().load(session.pharmacyId());
        var sale = sales.one(state, id);
        byte[] bytes = InvoicePdf.build(sale, (com.fasterxml.jackson.databind.node.ObjectNode) state.get("profile"));
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + sale.path("id").asText() + ".pdf\"")
                .body(bytes);
    }

    @PostMapping("/pos/checkout")
    public ResponseEntity<JsonNode> checkout(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.idempotent(request, null, null, false, (state, session) -> checkout.checkout(state, body));
    }

    @PostMapping("/sales/{id}/mark-paid")
    public JsonNode paid(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> sales.markPaid(state, id, body == null ? "" : body.path("payMode").asText()));
    }

    @PostMapping("/sales/{id}/advance")
    public JsonNode advance(HttpServletRequest request, @PathVariable String id) {
        return gateway.write(request, "orders", null, false, (state, session) -> sales.advance(state, id));
    }

    @PostMapping("/sales/{id}/cancel")
    public ResponseEntity<JsonNode> cancel(HttpServletRequest request, @PathVariable String id) {
        return gateway.idempotent(request, "orders", null, false, (state, session) -> sales.cancel(state, id));
    }

    @PostMapping("/sales/{id}/packing/start")
    public JsonNode start(HttpServletRequest request, @PathVariable String id) {
        return gateway.write(request, "orders", null, false, (state, session) -> sales.startPacking(state, id));
    }

    @PostMapping("/sales/{id}/packing/scan")
    public ResponseEntity<JsonNode> scan(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        String code = body == null ? "" : body.path("code").asText(body.path("q").asText(""));
        return gateway.idempotent(request, "orders", null, false, (state, session) -> sales.scan(state, id, code));
    }

    @PostMapping("/sales/{id}/packing/pick")
    public ResponseEntity<JsonNode> pick(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.idempotent(request, "orders", null, false, (state, session) -> sales.pick(state, id, body == null ? "" : body.path("productId").asText(), body == null ? 0 : body.path("delta").asDouble()));
    }

    @PostMapping("/sales/{id}/packing/seal")
    public JsonNode seal(HttpServletRequest request, @PathVariable String id) {
        return gateway.write(request, "orders", null, false, (state, session) -> sales.seal(state, id));
    }

    @PostMapping("/sales/{id}/handover")
    public JsonNode handover(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "orders", null, false, (state, session) -> sales.handover(state, id, body == null ? null : body.get("rider")));
    }

    @PostMapping("/sales/settle")
    public ResponseEntity<JsonNode> settle(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.idempotent(request, "ptbills", null, true, (state, session) -> sales.settle(state, body == null ? null : body.get("ids"), body == null ? "" : body.path("payMode").asText()));
    }

    @PostMapping("/kiosk/orders")
    public ResponseEntity<JsonNode> kiosk(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        String payMode = body == null ? "" : body.path("payMode").asText(body.path("pay").asText(""));
        return gateway.idempotent(request, "kiosk", null, false, (state, session) -> sales.kiosk(state, body == null ? null : body.get("lines"), payMode));
    }
}
