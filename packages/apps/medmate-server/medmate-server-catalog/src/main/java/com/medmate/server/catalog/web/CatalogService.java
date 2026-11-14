package com.medmate.server.catalog.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.catalog.CatalogAccess;
import com.medmate.server.catalog.CatalogConflict;
import com.medmate.server.catalog.CatalogDocuments;
import com.medmate.server.catalog.CatalogMissing;
import com.medmate.server.catalog.CatalogRules;
import com.medmate.server.catalog.CatalogStore;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.shared.error.ApiProblem;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
@Profile({"local", "prod", "identity-it"})
@ConditionalOnProperty(prefix = "medmate.catalog", name = "url")
public class CatalogService {

    private final CatalogStore store;

    public CatalogService(CatalogStore store) {
        this.store = store;
    }

    public CatalogDocuments.SearchResponse search(String query, String limit) {
        CatalogRules.Query parsed = CatalogRules.search(query, limit);
        if (parsed.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, parsed.problem());
        }
        return read(() -> store.search(parsed.text(), parsed.limit()));
    }

    public CatalogDocuments.CatalogList list(
            AccountPrincipal actor,
            String kind,
            String query,
            String displayName,
            String prescription,
            String form,
            String medicineType,
            String fmcgType,
            String marketer,
            String page,
            String size) {
        require(actor);
        CatalogRules.Listing listing = CatalogRules.list(
                kind, query, displayName, prescription, form, medicineType, fmcgType, marketer, page, size);
        if (listing.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, listing.problem());
        }
        return read(() -> store.list(listing));
    }

    public CatalogDocuments.ProductPage products(String ids) {
        CatalogRules.Ids parsed = CatalogRules.ids(ids);
        if (parsed.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, parsed.problem());
        }
        CatalogStore.Found found = read(() -> store.findMany(parsed.ids()));
        return new CatalogDocuments.ProductPage(found.drug(), found.fmcg(), found.missing());
    }

    public ResponseEntity<?> product(String productId) {
        CatalogStore.Found found = read(() -> store.findMany(List.of(productId)));
        if (found.drug().isEmpty() && found.fmcg().isEmpty()) {
            ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Product was not found");
            problem.setTitle("Not found");
            problem.setProperty("drug", List.of());
            problem.setProperty("fmcg", List.of());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
        }
        return ResponseEntity.ok(new CatalogDocuments.Products(found.drug(), found.fmcg()));
    }

    public ResponseEntity<CatalogDocuments.Products> createDrug(AccountPrincipal actor, JsonNode body) {
        require(actor);
        CatalogRules.ParsedDrug parsed = CatalogRules.drug(body, null);
        if (parsed.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, parsed.problem());
        }
        try {
            CatalogDocuments.DrugDetail saved = store.createDrug(parsed.draft());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new CatalogDocuments.Products(List.of(saved), List.of()));
        } catch (CatalogConflict exception) {
            throw problem(HttpStatus.CONFLICT, "Product already exists");
        } catch (DataAccessException exception) {
            throw unavailable();
        }
    }

    public ResponseEntity<CatalogDocuments.Products> updateDrug(
            AccountPrincipal actor, String productId, JsonNode body) {
        require(actor);
        String id = CatalogRules.pathId(productId);
        if (id == null) {
            throw problem(HttpStatus.BAD_REQUEST, "Product is not valid");
        }
        CatalogRules.ParsedDrug parsed = CatalogRules.drug(body, id);
        if (parsed.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, parsed.problem());
        }
        try {
            CatalogDocuments.DrugDetail saved = store.updateDrug(parsed.draft());
            return ResponseEntity.ok(new CatalogDocuments.Products(List.of(saved), List.of()));
        } catch (CatalogMissing exception) {
            throw problem(HttpStatus.NOT_FOUND, "Product was not found");
        } catch (DataAccessException exception) {
            throw unavailable();
        }
    }

    public ResponseEntity<CatalogDocuments.Products> createFmcg(AccountPrincipal actor, JsonNode body) {
        require(actor);
        CatalogRules.ParsedFmcg parsed = CatalogRules.fmcg(body, null);
        if (parsed.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, parsed.problem());
        }
        try {
            CatalogDocuments.FmcgDetail saved = store.createFmcg(parsed.draft());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new CatalogDocuments.Products(List.of(), List.of(saved)));
        } catch (CatalogConflict exception) {
            throw problem(HttpStatus.CONFLICT, "Product already exists");
        } catch (DataAccessException exception) {
            throw unavailable();
        }
    }

    public ResponseEntity<CatalogDocuments.Products> updateFmcg(
            AccountPrincipal actor, String productId, JsonNode body) {
        require(actor);
        String id = CatalogRules.pathId(productId);
        if (id == null) {
            throw problem(HttpStatus.BAD_REQUEST, "Product is not valid");
        }
        CatalogRules.ParsedFmcg parsed = CatalogRules.fmcg(body, id);
        if (parsed.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, parsed.problem());
        }
        try {
            CatalogDocuments.FmcgDetail saved = store.updateFmcg(parsed.draft());
            return ResponseEntity.ok(new CatalogDocuments.Products(List.of(), List.of(saved)));
        } catch (CatalogMissing exception) {
            throw problem(HttpStatus.NOT_FOUND, "Product was not found");
        } catch (DataAccessException exception) {
            throw unavailable();
        }
    }

    private <T> T read(java.util.function.Supplier<T> call) {
        try {
            return call.get();
        } catch (DataAccessException exception) {
            throw unavailable();
        }
    }

    private static void require(AccountPrincipal actor) {
        if (!CatalogAccess.write(actor)) {
            throw problem(HttpStatus.FORBIDDEN, "This action is not allowed.");
        }
    }

    private static ApiProblem unavailable() {
        return problem(HttpStatus.SERVICE_UNAVAILABLE, "Medicine catalog is unavailable");
    }

    private static ApiProblem problem(HttpStatus status, String detail) {
        String title =
                switch (status) {
                    case BAD_REQUEST -> "Bad request";
                    case FORBIDDEN -> "Forbidden";
                    case NOT_FOUND -> "Not found";
                    default -> status.getReasonPhrase();
                };
        return new ApiProblem(status, title, detail);
    }
}
