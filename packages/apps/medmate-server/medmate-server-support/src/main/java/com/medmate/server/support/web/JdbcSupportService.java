package com.medmate.server.support.web;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.support.access.SupportAccess;
import com.medmate.server.support.access.SupportRules;
import com.medmate.server.support.store.SupportStore;
import com.medmate.server.support.stream.SupportHub;
import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@Profile({"local", "prod", "identity-it"})
public class JdbcSupportService implements SupportService {

    private final SupportStore store;
    private final AccountDirectory directory;
    private final SupportHub hub;
    private final Clock clock;

    public JdbcSupportService(SupportStore store, AccountDirectory directory, SupportHub hub, Clock clock) {
        this.store = store;
        this.directory = directory;
        this.hub = hub;
        this.clock = clock;
    }

    @Override
    public List<SupportViews.FaqView> faqs(AccountPrincipal principal) {
        if (!SupportAccess.faqs(principal)) {
            throw forbidden();
        }
        boolean publishedOnly = !SupportAccess.editFaqs(principal);
        return store.faqs(publishedOnly).stream().map(JdbcSupportService::faq).toList();
    }

    @Override
    @Transactional
    public SupportViews.FaqView createFaq(AccountPrincipal principal, String question, String answer) {
        if (!SupportAccess.editFaqs(principal)) {
            throw forbidden();
        }
        SupportRules.FaqText text = SupportRules.faq(question, answer);
        UUID id = UUID.randomUUID();
        Instant now = clock.instant();
        store.insertFaq(id, text.question(), text.answer(), store.nextFaqPosition(), now);
        return store.findFaq(id).map(JdbcSupportService::faq).orElseThrow(JdbcSupportService::missingFaq);
    }

    @Override
    @Transactional
    public SupportViews.FaqView updateFaq(
            AccountPrincipal principal, UUID id, String question, String answer, boolean published) {
        if (!SupportAccess.editFaqs(principal)) {
            throw forbidden();
        }
        if (store.findFaq(id).isEmpty()) {
            throw missingFaq();
        }
        SupportRules.FaqText text = SupportRules.faq(question, answer);
        store.updateFaq(id, text.question(), text.answer(), published, clock.instant());
        return store.findFaq(id).map(JdbcSupportService::faq).orElseThrow(JdbcSupportService::missingFaq);
    }

    @Override
    @Transactional
    public List<SupportViews.FaqView> reorder(AccountPrincipal principal, List<UUID> ids) {
        if (!SupportAccess.editFaqs(principal)) {
            throw forbidden();
        }
        List<UUID> existing = store.faqIds();
        if (ids == null || ids.size() != existing.size() || !new HashSet<>(ids).equals(new HashSet<>(existing))) {
            throw bad("FAQ order is incomplete.");
        }
        for (int index = 0; index < ids.size(); index++) {
            store.setFaqPosition(ids.get(index), index + 1);
        }
        return faqs(principal);
    }

    @Override
    @Transactional
    public SupportViews.CaseDetail createCase(
            AccountPrincipal principal, String kind, String subject, String category, String details) {
        if (!SupportAccess.createCase(principal)) {
            throw forbidden();
        }
        SupportRules.Opened opened = SupportRules.open(kind, subject, category, details);
        UUID id = UUID.randomUUID();
        Instant now = clock.instant();
        store.insertCase(id, principal.pharmacyId(), principal.id(), opened.subject(), opened.category(), now);
        if (opened.firstMessage() != null) {
            store.insertMessage(UUID.randomUUID(), id, principal.id(), opened.firstMessage(), now);
        }
        SupportViews.CaseDetail detail = detail(requireCase(id));
        afterCommit(() -> hub.caseUpdated(detail.id(), detail.pharmacyId()));
        return detail;
    }

    @Override
    public List<SupportViews.CaseSummary> cases(AccountPrincipal principal) {
        if (!SupportAccess.listCases(principal)) {
            throw forbidden();
        }
        UUID pharmacyId = SupportAccess.editFaqs(principal) ? null : principal.pharmacyId();
        return summaries(store.cases(pharmacyId));
    }

    @Override
    public SupportViews.CaseDetail caseDetail(AccountPrincipal principal, UUID id) {
        if (!SupportAccess.listCases(principal)) {
            throw forbidden();
        }
        SupportStore.CaseRow row = requireCase(id);
        if (!SupportAccess.readCase(principal, row.pharmacyId())) {
            throw forbidden();
        }
        return detail(row);
    }

    @Override
    @Transactional
    public SupportViews.MessageView message(AccountPrincipal principal, UUID id, String text) {
        if (!SupportAccess.listCases(principal)) {
            throw forbidden();
        }
        SupportStore.CaseRow current = requireCase(id);
        if (!SupportAccess.reply(principal, current.pharmacyId())) {
            throw forbidden();
        }
        SupportRules.reply(phase(current));
        String body = SupportRules.message(text);
        UUID messageId = UUID.randomUUID();
        Instant now = clock.instant();
        if (!store.insertMessage(messageId, id, principal.id(), body, now)) {
            throw conflict("This chat is already resolved.");
        }
        String authorName = directory.displayNames(Set.of(principal.id())).getOrDefault(principal.id(), "");
        afterCommit(() -> {
            hub.messageCreated(id, current.pharmacyId());
            hub.caseUpdated(id, current.pharmacyId());
        });
        return new SupportViews.MessageView(messageId, principal.id(), authorName, body, now);
    }

    @Override
    @Transactional
    public SupportViews.CaseDetail claim(AccountPrincipal principal, UUID id) {
        if (!SupportAccess.claim(principal)) {
            throw forbidden();
        }
        SupportStore.CaseRow row = requireCase(id);
        SupportRules.claim(phase(row), principal.id());
        if (!store.claim(id, principal.id())) {
            throw conflict("This chat has already been picked up.");
        }
        SupportViews.CaseDetail detail = detail(requireCase(id));
        afterCommit(() -> hub.caseUpdated(detail.id(), detail.pharmacyId()));
        return detail;
    }

    @Override
    @Transactional
    public SupportViews.CaseDetail resolve(AccountPrincipal principal, UUID id) {
        SupportStore.CaseRow row = requireCase(id);
        if (!SupportAccess.resolve(principal, row.pharmacyId())) {
            throw forbidden();
        }
        SupportRules.resolve(phase(row));
        if (!store.resolve(id, principal.id(), clock.instant())) {
            throw conflict("This chat is already resolved.");
        }
        SupportViews.CaseDetail detail = detail(requireCase(id));
        afterCommit(() -> hub.caseUpdated(detail.id(), detail.pharmacyId()));
        return detail;
    }

    private SupportStore.CaseRow requireCase(UUID id) {
        return store.findCase(id).orElseThrow(JdbcSupportService::missingCase);
    }

    private SupportViews.CaseDetail detail(SupportStore.CaseRow row) {
        List<SupportStore.MessageRow> messages = store.messages(row.id());
        Set<UUID> accounts = new LinkedHashSet<>();
        if (row.assigneeId() != null) {
            accounts.add(row.assigneeId());
        }
        messages.forEach(message -> accounts.add(message.authorId()));
        Map<UUID, String> names = directory.displayNames(accounts);
        String pharmacyName = directory.pharmacyNames(Set.of(row.pharmacyId())).getOrDefault(row.pharmacyId(), "");
        List<SupportViews.MessageView> views = messages.stream()
                .map(message -> new SupportViews.MessageView(
                        message.id(),
                        message.authorId(),
                        names.getOrDefault(message.authorId(), ""),
                        message.body(),
                        message.createdAt()))
                .toList();
        SupportViews.CaseSummary summary = summary(row, pharmacyName, name(names, row.assigneeId()));
        return new SupportViews.CaseDetail(
                summary.id(),
                summary.ticketNumber(),
                summary.pharmacyId(),
                summary.pharmacyName(),
                summary.subject(),
                summary.category(),
                summary.status(),
                summary.assigneeId(),
                summary.assigneeName(),
                summary.createdAt(),
                summary.resolvedAt(),
                views);
    }

    private List<SupportViews.CaseSummary> summaries(List<SupportStore.CaseRow> rows) {
        Set<UUID> pharmacies = new LinkedHashSet<>();
        Set<UUID> accounts = new LinkedHashSet<>();
        for (SupportStore.CaseRow row : rows) {
            pharmacies.add(row.pharmacyId());
            if (row.assigneeId() != null) {
                accounts.add(row.assigneeId());
            }
        }
        Map<UUID, String> pharmacyNames = directory.pharmacyNames(pharmacies);
        Map<UUID, String> names = directory.displayNames(accounts);
        return rows.stream()
                .map(row ->
                        summary(row, pharmacyNames.getOrDefault(row.pharmacyId(), ""), name(names, row.assigneeId())))
                .toList();
    }

    private static SupportViews.CaseSummary summary(
            SupportStore.CaseRow row, String pharmacyName, String assigneeName) {
        return new SupportViews.CaseSummary(
                row.id(),
                "TKT-" + row.ticketNumber(),
                row.pharmacyId(),
                pharmacyName,
                row.subject(),
                row.category(),
                row.status().wire(),
                row.assigneeId(),
                assigneeName,
                row.createdAt(),
                row.resolvedAt());
    }

    private static String name(Map<UUID, String> names, UUID id) {
        if (id == null) {
            return null;
        }
        return names.getOrDefault(id, "");
    }

    private static SupportRules.Phase phase(SupportStore.CaseRow row) {
        return new SupportRules.Phase(row.status(), row.assigneeId());
    }

    private static SupportViews.FaqView faq(SupportStore.FaqRow row) {
        return new SupportViews.FaqView(row.id(), row.question(), row.answer(), row.position(), row.published());
    }

    private void afterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    private static ApiProblem forbidden() {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", "This action is not allowed.");
    }

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem conflict(String detail) {
        return new ApiProblem(HttpStatus.CONFLICT, "Conflict", detail);
    }

    private static ApiProblem missingCase() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Support case was not found.");
    }

    private static ApiProblem missingFaq() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "FAQ was not found.");
    }
}
