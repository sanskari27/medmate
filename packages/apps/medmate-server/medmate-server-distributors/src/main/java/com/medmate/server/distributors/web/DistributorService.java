package com.medmate.server.distributors.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.distributors.DistributorRules;
import com.medmate.server.distributors.store.DistributorStore;
import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.shared.web.DayRange;
import com.medmate.server.shared.web.PageQuery;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class DistributorService {

    private final DistributorStore distributors;

    public DistributorService(DistributorStore distributors) {
        this.distributors = distributors;
    }

    public DistributorViews.ListResponse list(AccountPrincipal actor) {
        require(actor, DistributorRules.READ, "Distributors cannot be read");
        List<DistributorViews.DistributorCard> cards = new ArrayList<>();
        for (DistributorViews.DistributorView view : views(actor.pharmacyId(), distributors.list(actor.pharmacyId()))) {
            cards.add(card(view));
        }
        return new DistributorViews.ListResponse(cards);
    }

    public DistributorViews.PaymentList payments(AccountPrincipal actor, String code, PageQuery page, DayRange range) {
        require(actor, DistributorRules.READ, "Distributors cannot be read");
        distributors.find(actor.pharmacyId(), code).orElseThrow(DistributorService::missing);
        List<DistributorViews.TransactionView> payments = new ArrayList<>();
        for (DistributorStore.TransactionRow row :
                distributors.payments(actor.pharmacyId(), code, range.from(), range.to(), page.size(), page.offset())) {
            payments.add(new DistributorViews.TransactionView(
                    row.code(), row.type(), row.amount(), row.reference(), row.note(), row.mode(), row.recordedAt()));
        }
        DistributorStore.LedgerSums sums = distributors.ledgerSums(actor.pharmacyId(), code, range.from(), range.to());
        return new DistributorViews.PaymentList(
                payments,
                page.page(),
                page.size(),
                distributors.paymentCount(actor.pharmacyId(), code, range.from(), range.to()),
                sums.purchases(),
                sums.payments(),
                sums.returns());
    }

    public DistributorViews.OneResponse one(AccountPrincipal actor, String code) {
        require(actor, DistributorRules.READ, "Distributors cannot be read");
        DistributorStore.DistributorRow row =
                distributors.find(actor.pharmacyId(), code).orElseThrow(DistributorService::missing);
        return new DistributorViews.OneResponse(view(row, lines(actor.pharmacyId(), code)));
    }

    @Transactional
    public DistributorViews.OneResponse create(AccountPrincipal actor, JsonNode body) {
        require(actor, DistributorRules.CREATE, "Distributors cannot be created");
        DistributorRules.Prepared prepared = DistributorRules.prepareCreate(body);
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        if (prepared.setsInactive() && !allowed(actor, DistributorRules.DELETE)) {
            throw forbidden("Distributors cannot be set inactive");
        }
        if (!distributors.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        String code = DistributorRules.nextCode("DST", distributors.codes(actor.pharmacyId()));
        distributors.insert(actor.pharmacyId(), code, prepared.values());
        return saved(actor.pharmacyId(), code);
    }

    @Transactional
    public DistributorViews.OneResponse update(AccountPrincipal actor, String code, JsonNode body) {
        if (!distributors.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        DistributorStore.DistributorRow current =
                distributors.find(actor.pharmacyId(), code).orElseThrow(DistributorService::missing);
        List<DistributorStore.TransactionRow> lines = lines(actor.pharmacyId(), code);
        DistributorRules.Prepared prepared = DistributorRules.prepareUpdate(body, current.values(), !lines.isEmpty());
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        if (prepared.needsUpdate() && !allowed(actor, DistributorRules.UPDATE)) {
            throw forbidden("Distributors cannot be updated");
        }
        if (prepared.setsInactive() && !allowed(actor, DistributorRules.DELETE)) {
            throw forbidden("Distributors cannot be set inactive");
        }
        distributors.update(actor.pharmacyId(), code, prepared.values());
        return saved(actor.pharmacyId(), code);
    }

    @Transactional
    public DistributorViews.OneResponse pay(AccountPrincipal actor, String code, JsonNode body) {
        require(actor, DistributorRules.PAY, "Distributors cannot be paid");
        if (!distributors.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        DistributorStore.DistributorRow current =
                distributors.find(actor.pharmacyId(), code).orElseThrow(DistributorService::missing);
        List<DistributorStore.TransactionRow> lines = lines(actor.pharmacyId(), code);
        int owed = DistributorRules.outstanding(current.openingBalance(), ledger(lines));
        DistributorRules.Payment payment = DistributorRules.preparePayment(body, owed);
        if (payment.problem() != null) {
            throw bad(payment.problem());
        }
        String txn = DistributorRules.nextCode("TXN", distributors.transactionCodes(actor.pharmacyId()));
        distributors.insertTransaction(
                actor.pharmacyId(),
                code,
                txn,
                "payment",
                payment.amount(),
                null,
                payment.note(),
                payment.mode(),
                Instant.now());
        return saved(actor.pharmacyId(), code);
    }

    private DistributorViews.OneResponse saved(UUID pharmacyId, String code) {
        DistributorStore.DistributorRow row =
                distributors.find(pharmacyId, code).orElseThrow(DistributorService::missing);
        return new DistributorViews.OneResponse(view(row, lines(pharmacyId, code)));
    }

    private static DistributorViews.DistributorCard card(DistributorViews.DistributorView view) {
        return new DistributorViews.DistributorCard(
                view.id(),
                view.name(),
                view.contactPerson(),
                view.phone(),
                view.email(),
                view.gstin(),
                view.drugLicenceNumber(),
                view.address(),
                view.city(),
                view.state(),
                view.paymentTerms(),
                view.openingBalance(),
                view.outstanding(),
                view.active(),
                view.showInPurchases());
    }

    private List<DistributorViews.DistributorView> views(UUID pharmacyId, List<DistributorStore.DistributorRow> rows) {
        Map<String, List<DistributorStore.TransactionRow>> byCode = grouped(pharmacyId);
        List<DistributorViews.DistributorView> views = new ArrayList<>();
        for (DistributorStore.DistributorRow row : rows) {
            views.add(view(row, byCode.getOrDefault(row.code(), List.of())));
        }
        return views;
    }

    private DistributorViews.DistributorView view(
            DistributorStore.DistributorRow row, List<DistributorStore.TransactionRow> lines) {
        List<DistributorViews.TransactionView> transactions = new ArrayList<>();
        List<DistributorRules.Line> ledger = new ArrayList<>();
        for (DistributorStore.TransactionRow line : lines) {
            ledger.add(new DistributorRules.Line(line.type(), line.amount()));
            transactions.add(new DistributorViews.TransactionView(
                    line.code(),
                    line.type(),
                    line.amount(),
                    line.reference(),
                    line.note(),
                    line.mode(),
                    line.recordedAt()));
        }
        DistributorRules.Values values = row.values();
        return new DistributorViews.DistributorView(
                row.code(),
                values.name(),
                values.contactPerson(),
                values.phone(),
                values.email(),
                values.gstin(),
                values.drugLicenceNumber(),
                values.address(),
                values.city(),
                values.state(),
                values.paymentTerms(),
                values.openingBalance(),
                DistributorRules.outstanding(values.openingBalance(), ledger),
                values.active(),
                values.showInPurchases(),
                transactions);
    }

    private List<DistributorStore.TransactionRow> lines(UUID pharmacyId, String code) {
        return grouped(pharmacyId).getOrDefault(code, List.of());
    }

    private Map<String, List<DistributorStore.TransactionRow>> grouped(UUID pharmacyId) {
        Map<String, List<DistributorStore.TransactionRow>> byCode = new HashMap<>();
        for (DistributorStore.TransactionRow line : distributors.transactions(pharmacyId)) {
            byCode.computeIfAbsent(line.distributorCode(), key -> new ArrayList<>())
                    .add(line);
        }
        return byCode;
    }

    private static List<DistributorRules.Line> ledger(List<DistributorStore.TransactionRow> lines) {
        List<DistributorRules.Line> ledger = new ArrayList<>();
        for (DistributorStore.TransactionRow line : lines) {
            ledger.add(new DistributorRules.Line(line.type(), line.amount()));
        }
        return ledger;
    }

    private boolean allowed(AccountPrincipal actor, String key) {
        return Access.pharmacy(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus(),
                actor.permissions(),
                key);
    }

    private void require(AccountPrincipal actor, String key, String detail) {
        if (!allowed(actor, key)) {
            throw forbidden(detail);
        }
    }

    private static ApiProblem missing() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Distributor was not found");
    }

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem forbidden(String detail) {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }
}
