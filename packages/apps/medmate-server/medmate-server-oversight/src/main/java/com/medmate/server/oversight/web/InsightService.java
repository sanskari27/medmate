package com.medmate.server.oversight.web;

import com.medmate.server.dashboard.DashboardRules;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.BlockRules;
import com.medmate.server.oversight.InsightRules;
import com.medmate.server.oversight.InsightViews;
import com.medmate.server.oversight.store.InsightStore;
import com.medmate.server.reports.ReportBooks;
import com.medmate.server.reports.ReportRules;
import com.medmate.server.reports.store.ReportStore;
import com.medmate.server.shared.error.ApiProblem;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@Profile({"local", "prod", "identity-it"})
public class InsightService {

    private final InsightStore store;
    private final ReportStore reports;
    private final Clock clock;

    public InsightService(InsightStore store, ReportStore reports, Clock clock) {
        this.store = store;
        this.reports = reports;
        this.clock = clock;
    }

    public InsightViews.Fleet fleet(AccountPrincipal actor) {
        requireReader(actor);
        LocalDate today = LocalDate.now(clock.withZone(DashboardRules.ZONE));
        DashboardRules.Parsed range = DashboardRules.parse("30d", today);
        List<InsightStore.Profile> profiles = store.profiles();
        List<InsightRules.Score> scores = new ArrayList<>();
        for (InsightStore.Profile profile : profiles) {
            scores.add(InsightRules.score(profile, reports.load(profile.id()), range, today));
        }
        return InsightRules.fleet(
                profiles, store.resolveHours(), store.openCases(), store.ticketRanks(), scores, "30d");
    }

    public InsightViews.One read(AccountPrincipal actor, UUID pharmacyId, String range) {
        requireReader(actor);
        if (!store.exists(pharmacyId)) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        LocalDate today = LocalDate.now(clock.withZone(DashboardRules.ZONE));
        String raw = range == null || range.isBlank() ? "30d" : range.trim();
        DashboardRules.Parsed parsed = DashboardRules.parse(raw, today);
        if (parsed.problem() != null) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", parsed.problem());
        }
        ReportBooks books = reports.load(pharmacyId);
        DashboardRules.Snapshot snapshot = DashboardRules.build(books, parsed, today);
        LocalDate monthFrom = today.withDayOfMonth(1);
        LocalDate monthTo = today.withDayOfMonth(today.lengthOfMonth());
        return InsightRules.one(
                snapshot,
                books,
                ReportRules.run("sales-summary", books, parsed.from(), parsed.to(), today),
                ReportRules.run("pnl", books, parsed.from(), parsed.to(), today),
                ReportRules.run("pnl", books, monthFrom, monthTo, today),
                ReportRules.run("gstr3b", books, parsed.from(), parsed.to(), today),
                ReportRules.run("receivable-ageing", books, parsed.from(), parsed.to(), today),
                store.activity(pharmacyId),
                today);
    }

    private static void requireReader(AccountPrincipal actor) {
        if (actor == null || !BlockRules.directoryReader(actor.accountType(), actor.disabled(), actor.subtypes())) {
            throw new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", "Pharmacy insights are not available");
        }
    }
}
