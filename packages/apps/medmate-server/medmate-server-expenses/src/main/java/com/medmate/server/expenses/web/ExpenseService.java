package com.medmate.server.expenses.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.expenses.ExpenseRules;
import com.medmate.server.expenses.store.ExpenseStore;
import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.shared.web.PageQuery;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class ExpenseService {

    private final ExpenseStore expenses;
    private final Clock clock;

    public ExpenseService(ExpenseStore expenses, Clock clock) {
        this.expenses = expenses;
        this.clock = clock;
    }

    public ExpenseViews.ListResponse list(
            AccountPrincipal actor, PageQuery page, String from, String to, String category, String query) {
        require(actor, ExpenseRules.READ, "Expenses cannot be read");
        ExpenseStore.Filter filter = filter(from, to, category, query);
        int total = expenses.count(actor.pharmacyId(), filter);
        List<ExpenseViews.ExpenseView> rows =
                expenses.page(actor.pharmacyId(), filter, page.size(), page.offset()).stream()
                        .map(ExpenseService::view)
                        .toList();
        return new ExpenseViews.ListResponse(
                rows,
                summary(actor, filter),
                ExpenseRules.categories(expenses.categories(actor.pharmacyId())),
                page.page(),
                page.size(),
                total);
    }

    public ExpenseViews.ExportResponse export(
            AccountPrincipal actor, String from, String to, String category, String query) {
        require(actor, ExpenseRules.READ, "Expenses cannot be read");
        List<ExpenseViews.ExpenseView> rows =
                expenses.export(actor.pharmacyId(), filter(from, to, category, query)).stream()
                        .map(ExpenseService::view)
                        .toList();
        return new ExpenseViews.ExportResponse(rows);
    }

    @Transactional
    public ExpenseViews.OneResponse create(AccountPrincipal actor, JsonNode body) {
        require(actor, ExpenseRules.CREATE, "Expenses cannot be created");
        ExpenseRules.Parsed parsed = ExpenseRules.parse(body, today());
        if (parsed.problem() != null) {
            throw bad(parsed.problem());
        }
        if (!expenses.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        int seq = expenses.nextSeq(actor.pharmacyId());
        expenses.insert(actor.pharmacyId(), seq, parsed.draft());
        return new ExpenseViews.OneResponse(view(seq, parsed.draft()));
    }

    private ExpenseViews.SummaryView summary(AccountPrincipal actor, ExpenseStore.Filter filter) {
        List<BigDecimal> amounts = new ArrayList<>();
        List<Integer> rates = new ArrayList<>();
        for (ExpenseStore.AmountRow row : expenses.amounts(actor.pharmacyId(), filter)) {
            amounts.add(row.amount());
            rates.add(row.gst());
        }
        ExpenseRules.Summary summary = ExpenseRules.summarize(amounts, rates);
        return new ExpenseViews.SummaryView(
                summary.count(), ExpenseRules.moneyText(summary.total()), ExpenseRules.moneyText(summary.gst()));
    }

    private ExpenseStore.Filter filter(String from, String to, String category, String query) {
        ExpenseRules.Range range = ExpenseRules.range(from, to, today());
        if (range == null) {
            throw bad("Date range is not valid");
        }
        return new ExpenseStore.Filter(
                range.from(), range.to(), ExpenseRules.categoryFilter(category), PageQuery.like(query));
    }

    private LocalDate today() {
        return LocalDate.now(clock.withZone(ExpenseRules.ZONE));
    }

    private static ExpenseViews.ExpenseView view(ExpenseStore.ExpenseRow row) {
        return new ExpenseViews.ExpenseView(
                row.number(),
                row.spentOn().toString(),
                row.party(),
                row.category(),
                row.paymentMode(),
                ExpenseRules.moneyText(row.amount()),
                row.gst(),
                row.note());
    }

    private static ExpenseViews.ExpenseView view(int seq, ExpenseRules.Draft draft) {
        return new ExpenseViews.ExpenseView(
                ExpenseRules.number(seq),
                draft.spentOn().toString(),
                draft.party(),
                draft.category(),
                draft.paymentMode(),
                ExpenseRules.moneyText(draft.amount()),
                draft.gst(),
                draft.note());
    }

    private void require(AccountPrincipal actor, String key, String detail) {
        if (!allowed(actor, key)) {
            throw forbidden(detail);
        }
    }

    private static boolean allowed(AccountPrincipal actor, String key) {
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

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem forbidden(String detail) {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }
}
