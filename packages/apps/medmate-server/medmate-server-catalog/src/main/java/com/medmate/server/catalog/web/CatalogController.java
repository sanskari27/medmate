package com.medmate.server.catalog.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.catalog.CatalogDocuments;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.shared.error.ProblemResponses;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile({"local", "prod", "identity-it"})
@ConditionalOnProperty(prefix = "medmate.catalog", name = "url")
public class CatalogController {

    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/api/search")
    public CatalogDocuments.SearchResponse search(
            @RequestParam(required = false) String q, @RequestParam(required = false) String limit) {
        return catalog.search(q, limit);
    }

    @GetMapping("/api/v1/catalog")
    public CatalogDocuments.CatalogList list(
            Authentication authentication,
            @RequestParam(required = false) String kind,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String displayName,
            @RequestParam(required = false) String prescription,
            @RequestParam(required = false) String form,
            @RequestParam(required = false) String medicineType,
            @RequestParam(required = false) String fmcgType,
            @RequestParam(required = false) String marketer,
            @RequestParam(required = false) String page,
            @RequestParam(required = false) String size) {
        return catalog.list(
                principal(authentication),
                kind,
                q,
                displayName,
                prescription,
                form,
                medicineType,
                fmcgType,
                marketer,
                page,
                size);
    }

    @GetMapping("/api/products")
    public CatalogDocuments.ProductPage products(@RequestParam(required = false) String ids) {
        return catalog.products(ids);
    }

    @GetMapping("/api/products/{productId}")
    public ResponseEntity<?> product(@PathVariable String productId, HttpServletRequest request) {
        ResponseEntity<?> response = catalog.product(productId);
        if (response.getBody() instanceof ProblemDetail problem) {
            problem.setProperty("requestId", ProblemResponses.requestId(request));
        }
        return response;
    }

    @PostMapping("/api/v1/catalog/drugs")
    public ResponseEntity<CatalogDocuments.Products> createDrug(
            Authentication authentication, @RequestBody JsonNode body) {
        return catalog.createDrug(principal(authentication), body);
    }

    @PutMapping("/api/v1/catalog/drugs/{productId}")
    public ResponseEntity<CatalogDocuments.Products> updateDrug(
            Authentication authentication, @PathVariable String productId, @RequestBody JsonNode body) {
        return catalog.updateDrug(principal(authentication), productId, body);
    }

    @PostMapping("/api/v1/catalog/fmcg")
    public ResponseEntity<CatalogDocuments.Products> createFmcg(
            Authentication authentication, @RequestBody JsonNode body) {
        return catalog.createFmcg(principal(authentication), body);
    }

    @PutMapping("/api/v1/catalog/fmcg/{productId}")
    public ResponseEntity<CatalogDocuments.Products> updateFmcg(
            Authentication authentication, @PathVariable String productId, @RequestBody JsonNode body) {
        return catalog.updateFmcg(principal(authentication), productId, body);
    }

    private static AccountPrincipal principal(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof AccountPrincipal account) {
            return account;
        }
        return null;
    }
}
