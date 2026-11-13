package com.medmate.server.reports.web;

import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.reports.ReportBooks;
import com.medmate.server.reports.ReportRules;
import com.medmate.server.reports.store.ReportStore;
import com.medmate.server.shared.error.ApiProblem;
import java.time.Clock;
import java.time.LocalDate;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@Profile({"local", "prod", "identity-it"})
public class ReportService {

    private final ReportStore reports;
    private final Clock clock;

    public ReportService(ReportStore reports, Clock clock) {
        this.reports = reports;
        this.clock = clock;
    }

    public ReportRules.Result read(AccountPrincipal actor, String id, String from, String to) {
        require(actor, ReportRules.READ, "Reports cannot be read");
        return build(actor, id, from, to);
    }

    public String export(AccountPrincipal actor, String id, String from, String to) {
        require(actor, ReportRules.EXPORT, "Reports cannot be exported");
        return ReportRules.csv(build(actor, id, from, to));
    }

    private ReportRules.Result build(AccountPrincipal actor, String id, String from, String to) {
        if (!ReportRules.known(id)) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "This report is not available.");
        }
        LocalDate today = LocalDate.now(clock.withZone(ReportRules.ZONE));
        ReportRules.Window window = ReportRules.window(from, to, today);
        if (window.problem() != null) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", window.problem());
        }
        ReportBooks books = reports.load(actor.pharmacyId());
        return ReportRules.run(id, books, window.from(), window.to(), today);
    }

    private static void require(AccountPrincipal actor, String key, String detail) {
        if (actor.pharmacyId() == null
                || !Access.pharmacy(
                        actor.accountType(),
                        actor.disabled(),
                        actor.pharmacyRole(),
                        actor.pharmacyId(),
                        actor.pharmacyId(),
                        actor.verificationStatus(),
                        actor.permissions(),
                        key)) {
            throw new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
        }
    }
}
