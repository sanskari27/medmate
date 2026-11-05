package com.medmate.servercore.pharmacy.reports;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.pharmacy.store.AccessGuard;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {
    private final PharmacyGateway gateway;
    private final ReportService reports;

    public ReportController(PharmacyGateway gateway, ReportService reports) {
        this.gateway = gateway;
        this.reports = reports;
    }

    @GetMapping("/catalog")
    public JsonNode catalog(HttpServletRequest request) {
        return gateway.read(request, "reports", null, false, (state, session) -> reports.catalog());
    }

    @GetMapping("/{id}")
    public JsonNode one(HttpServletRequest request, @PathVariable String id, @RequestParam(required = false) Long from, @RequestParam(required = false) Long to) {
        long start = from == null ? System.currentTimeMillis() - 365L * 86400000 : from;
        long end = to == null ? System.currentTimeMillis() : to;
        return gateway.read(request, "reports", null, false, (state, session) -> reports.run(id, state, start, end));
    }

    @GetMapping(value = "/{id}/export.csv", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<String> csv(HttpServletRequest request, @PathVariable String id, @RequestParam(required = false) Long from, @RequestParam(required = false) Long to) {
        var session = gateway.require(request);
        var state = gateway.store().load(session.pharmacyId());
        AccessGuard.requirePlan(state, "reports");
        AccessGuard.requirePerm(state, session.userId(), "reports");
        long start = from == null ? System.currentTimeMillis() - 365L * 86400000 : from;
        long end = to == null ? System.currentTimeMillis() : to;
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/csv;charset=UTF-8")).body(reports.csv(reports.run(id, state, start, end)));
    }
}
