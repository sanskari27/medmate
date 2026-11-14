package com.medmate.server.prep.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.catalog.CatalogDocuments;
import com.medmate.server.catalog.CatalogStore;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.prep.PrepAccess;
import com.medmate.server.prep.PrepRules;
import com.medmate.server.prep.store.PrepStore;
import com.medmate.server.shared.error.ApiProblem;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class PrepService {

    private final PrepStore lists;
    private final ObjectProvider<CatalogStore> catalogs;
    private final java.time.Clock clock;

    public PrepService(PrepStore lists, ObjectProvider<CatalogStore> catalogs, java.time.Clock clock) {
        this.lists = lists;
        this.catalogs = catalogs;
        this.clock = clock;
    }

    @Transactional
    public PrepViews.Created create(AccountPrincipal actor, JsonNode body) {
        require(actor);
        PrepRules.Named name = PrepRules.name(body);
        if (name.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, name.problem());
        }
        if (lists.nameTaken(actor.id(), name.value(), null)) {
            throw taken();
        }
        try {
            PrepStore.Header header = lists.insert(actor.id(), name.value(), clock.instant());
            return new PrepViews.Created(summary(header, 0));
        } catch (DuplicateKeyException exception) {
            throw taken();
        }
    }

    public PrepViews.Listed list(AccountPrincipal actor) {
        require(actor);
        List<PrepViews.Summary> rows =
                lists.list(actor.id()).stream().map(row -> summary(row)).toList();
        return new PrepViews.Listed(rows);
    }

    public PrepViews.One read(AccountPrincipal actor, UUID id) {
        require(actor);
        PrepStore.Header header = owned(actor, id);
        return new PrepViews.One(detail(header));
    }

    @Transactional
    public PrepViews.Created rename(AccountPrincipal actor, UUID id, JsonNode body) {
        require(actor);
        PrepStore.Header header = owned(actor, id);
        PrepRules.Named name = PrepRules.name(body);
        if (name.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, name.problem());
        }
        if (lists.nameTaken(actor.id(), name.value(), header.id())) {
            throw taken();
        }
        try {
            PrepStore.Header renamed = lists.rename(header.id(), name.value(), clock.instant());
            return new PrepViews.Created(summary(renamed, lists.lineCount(header.id())));
        } catch (DuplicateKeyException exception) {
            throw taken();
        }
    }

    @Transactional
    public PrepViews.One replace(AccountPrincipal actor, UUID id, JsonNode body) {
        require(actor);
        PrepStore.Header header = owned(actor, id);
        PrepRules.Lines parsed = PrepRules.lines(body);
        if (parsed.problem() != null) {
            throw problem(HttpStatus.BAD_REQUEST, parsed.problem());
        }
        lists.replaceLines(header.id(), parsed.lines(), clock.instant());
        return new PrepViews.One(detail(lists.find(header.id()).orElseThrow(PrepService::missing)));
    }

    @Transactional
    public void delete(AccountPrincipal actor, UUID id) {
        require(actor);
        PrepStore.Header header = owned(actor, id);
        lists.delete(header.id());
    }

    public ResponseEntity<String> export(AccountPrincipal actor, UUID id) {
        require(actor);
        PrepStore.Header header = owned(actor, id);
        List<PrepRules.Line> lines = rules(lists.lines(header.id()));
        String incomplete = PrepRules.exportProblem(lines);
        if (incomplete != null) {
            throw problem(HttpStatus.BAD_REQUEST, incomplete);
        }
        String unknown = catalogProblem(lines);
        if (unknown != null) {
            throw problem(HttpStatus.BAD_REQUEST, unknown);
        }
        String csv = PrepRules.csv(lines);
        MediaType csvType = new MediaType("text", "csv", StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(csvType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(PrepRules.fileName(header.name()), StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .body(csv);
    }

    private String catalogProblem(List<PrepRules.Line> lines) {
        CatalogStore catalog = catalogs.getIfAvailable();
        if (catalog == null) {
            throw problem(HttpStatus.SERVICE_UNAVAILABLE, PrepRules.CATALOG_DOWN);
        }
        List<String> ids =
                lines.stream().map(PrepRules.Line::productId).distinct().toList();
        CatalogStore.Found found;
        try {
            found = catalog.findMany(ids);
        } catch (DataAccessException exception) {
            throw problem(HttpStatus.SERVICE_UNAVAILABLE, PrepRules.CATALOG_DOWN);
        }
        Set<String> drugs = new HashSet<>();
        for (CatalogDocuments.DrugDetail drug : found.drug()) {
            drugs.add(drug.productId());
        }
        Set<String> fmcg = new HashSet<>();
        for (CatalogDocuments.FmcgDetail item : found.fmcg()) {
            fmcg.add(item.productId());
        }
        for (int index = 0; index < lines.size(); index++) {
            String productId = lines.get(index).productId();
            boolean drug = drugs.contains(productId);
            boolean other = fmcg.contains(productId);
            if (drug && other) {
                return PrepRules.row(index + 1, PrepRules.AMBIGUOUS);
            }
            if (!drug && !other) {
                return PrepRules.row(index + 1, PrepRules.NOT_FOUND);
            }
        }
        return null;
    }

    private PrepStore.Header owned(AccountPrincipal actor, UUID id) {
        return lists.find(id)
                .filter(header -> actor.id().equals(header.ownerId()))
                .orElseThrow(PrepService::missing);
    }

    private PrepViews.Detail detail(PrepStore.Header header) {
        List<PrepViews.Line> lines =
                lists.lines(header.id()).stream().map(PrepService::line).toList();
        return new PrepViews.Detail(header.id(), header.name(), header.updatedAt(), lines);
    }

    private static List<PrepRules.Line> rules(List<PrepStore.StoredLine> lines) {
        return lines.stream()
                .map(line -> new PrepRules.Line(
                        line.productId(),
                        line.productName(),
                        line.batchNo() == null ? "" : line.batchNo(),
                        line.expiry(),
                        line.qty(),
                        line.free(),
                        line.rate(),
                        line.mrp(),
                        line.gst()))
                .toList();
    }

    private static PrepViews.Summary summary(PrepStore.Header header, int lineCount) {
        return new PrepViews.Summary(header.id(), header.name(), lineCount, header.updatedAt());
    }

    private static PrepViews.Summary summary(PrepStore.Summary row) {
        return new PrepViews.Summary(row.id(), row.name(), row.lineCount(), row.updatedAt());
    }

    private static PrepViews.Line line(PrepStore.StoredLine line) {
        String batch = line.batchNo() == null || line.batchNo().isEmpty() ? null : line.batchNo();
        return new PrepViews.Line(
                line.position(),
                line.productId(),
                line.productName(),
                batch,
                line.expiry(),
                line.qty(),
                line.free(),
                line.rate(),
                line.mrp(),
                line.gst());
    }

    private static void require(AccountPrincipal actor) {
        if (!PrepAccess.open(actor)) {
            throw problem(HttpStatus.FORBIDDEN, "This action is not allowed.");
        }
    }

    private static ApiProblem missing() {
        return problem(HttpStatus.NOT_FOUND, "List was not found");
    }

    private static ApiProblem taken() {
        return problem(HttpStatus.CONFLICT, PrepRules.NAME_TAKEN);
    }

    private static ApiProblem problem(HttpStatus status, String detail) {
        String title =
                switch (status) {
                    case BAD_REQUEST -> "Bad request";
                    case FORBIDDEN -> "Forbidden";
                    case NOT_FOUND -> "Not found";
                    case CONFLICT -> "Conflict";
                    case SERVICE_UNAVAILABLE -> "Service unavailable";
                    default -> status.getReasonPhrase();
                };
        return new ApiProblem(status, title, detail);
    }
}
