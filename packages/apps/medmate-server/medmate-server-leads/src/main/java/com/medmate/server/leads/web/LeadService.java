package com.medmate.server.leads.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.leads.LeadAccess;
import com.medmate.server.leads.LeadRules;
import com.medmate.server.leads.store.LeadStore;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.shared.web.PageQuery;
import java.time.Clock;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class LeadService {

    private final LeadStore leads;
    private final Clock clock;

    public LeadService(LeadStore leads, Clock clock) {
        this.leads = leads;
        this.clock = clock;
    }

    @Transactional
    public ResponseEntity<?> create(JsonNode body) {
        LeadRules.Parsed parsed = LeadRules.parse(body);
        if (parsed.dropped()) {
            return ResponseEntity.noContent().build();
        }
        if (parsed.draft() == null) {
            throw problem(HttpStatus.BAD_REQUEST, parsed.problem());
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new LeadViews.One(detail(leads.insert(parsed.draft(), clock.instant()))));
    }

    public LeadViews.ListResponse list(
            AccountPrincipal actor, PageQuery page, String status, String site, String type) {
        require(actor);
        LeadRules.Named statusFilter = LeadRules.statusFilter(status);
        LeadRules.Named siteFilter = LeadRules.siteFilter(site);
        LeadRules.Named formFilter = LeadRules.formFilter(type);
        if (statusFilter.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, statusFilter.problem());
        }
        if (siteFilter.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, siteFilter.problem());
        }
        if (formFilter.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, formFilter.problem());
        }
        int total = leads.count(statusFilter.value(), siteFilter.value(), formFilter.value());
        List<LeadViews.Summary> rows =
                leads
                        .page(statusFilter.value(), siteFilter.value(), formFilter.value(), page.size(), page.offset())
                        .stream()
                        .map(LeadService::summary)
                        .toList();
        return new LeadViews.ListResponse(rows, page.page(), page.size(), total);
    }

    public LeadViews.One read(AccountPrincipal actor, UUID id) {
        require(actor);
        return leads.find(id).map(row -> new LeadViews.One(detail(row))).orElseThrow(LeadService::missing);
    }

    @Transactional
    public LeadViews.One mark(AccountPrincipal actor, UUID id, JsonNode body) {
        require(actor);
        LeadRules.Named status = LeadRules.nextStatus(body);
        if (status.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, status.problem());
        }
        return leads.updateStatus(id, status.value())
                .map(row -> new LeadViews.One(detail(row)))
                .orElseThrow(LeadService::missing);
    }

    private static void require(AccountPrincipal actor) {
        if (!LeadAccess.read(actor)) {
            throw problem(HttpStatus.FORBIDDEN, "This action is not allowed.");
        }
    }

    private static ApiProblem missing() {
        return problem(HttpStatus.NOT_FOUND, "Lead was not found");
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

    private static LeadViews.Summary summary(LeadStore.LeadRow row) {
        return new LeadViews.Summary(
                row.id(), row.site(), row.type(), row.status(), row.name(), row.phone(), row.email(), row.createdAt());
    }

    private static LeadViews.Detail detail(LeadStore.LeadRow row) {
        return new LeadViews.Detail(
                row.id(),
                row.site(),
                row.type(),
                row.status(),
                row.createdAt(),
                row.name(),
                row.phone(),
                row.email(),
                row.pharmacyName(),
                row.cityPincode(),
                row.area(),
                row.city(),
                row.preferredTime(),
                row.monthlySales(),
                row.subject(),
                row.message(),
                row.source(),
                row.notes(),
                row.plan(),
                row.consent());
    }
}
