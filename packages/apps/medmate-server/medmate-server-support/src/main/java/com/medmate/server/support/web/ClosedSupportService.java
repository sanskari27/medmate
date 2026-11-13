package com.medmate.server.support.web;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.shared.web.PageQuery;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@Profile("!local & !prod & !identity-it")
public class ClosedSupportService implements SupportService {

    @Override
    public List<SupportViews.FaqView> faqs(AccountPrincipal principal) {
        throw closed();
    }

    @Override
    public SupportViews.FaqView createFaq(AccountPrincipal principal, String question, String answer) {
        throw closed();
    }

    @Override
    public SupportViews.FaqView updateFaq(
            AccountPrincipal principal, UUID id, String question, String answer, boolean published) {
        throw closed();
    }

    @Override
    public List<SupportViews.FaqView> reorder(AccountPrincipal principal, List<UUID> ids) {
        throw closed();
    }

    @Override
    public SupportViews.CaseDetail createCase(
            AccountPrincipal principal, String kind, String subject, String category, String details) {
        throw closed();
    }

    @Override
    public SupportViews.CaseList cases(AccountPrincipal principal, PageQuery page) {
        throw closed();
    }

    @Override
    public SupportViews.CaseDetail caseDetail(AccountPrincipal principal, UUID id) {
        throw closed();
    }

    @Override
    public SupportViews.MessageView message(AccountPrincipal principal, UUID id, String text) {
        throw closed();
    }

    @Override
    public SupportViews.CaseDetail claim(AccountPrincipal principal, UUID id) {
        throw closed();
    }

    @Override
    public SupportViews.CaseDetail resolve(AccountPrincipal principal, UUID id) {
        throw closed();
    }

    private static ApiProblem closed() {
        return new ApiProblem(HttpStatus.SERVICE_UNAVAILABLE, "Unavailable", "Support is not available.");
    }
}
