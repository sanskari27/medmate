package com.medmate.server.support.web;

import com.medmate.server.identity.web.Current;
import com.medmate.server.shared.error.ApiProblem;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SupportController {

    private final SupportService support;

    public SupportController(SupportService support) {
        this.support = support;
    }

    @GetMapping("/support/faqs")
    public List<SupportViews.FaqView> faqs(Authentication authentication) {
        return support.faqs(Current.require(authentication));
    }

    @PostMapping("/support/faqs")
    public SupportViews.FaqView createFaq(Authentication authentication, @RequestBody FaqRequest request) {
        return support.createFaq(Current.require(authentication), request.question(), request.answer());
    }

    @PatchMapping("/support/faqs/{id}")
    public SupportViews.FaqView updateFaq(
            Authentication authentication, @PathVariable UUID id, @RequestBody FaqUpdate request) {
        if (request.published() == null) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Published is required.");
        }
        return support.updateFaq(
                Current.require(authentication), id, request.question(), request.answer(), request.published());
    }

    @PostMapping("/support/faqs/order")
    public List<SupportViews.FaqView> reorder(Authentication authentication, @RequestBody FaqOrder request) {
        return support.reorder(Current.require(authentication), request.ids());
    }

    @PostMapping("/support/cases")
    public SupportViews.CaseDetail createCase(Authentication authentication, @RequestBody CaseRequest request) {
        return support.createCase(
                Current.require(authentication),
                request.kind(),
                request.subject(),
                request.category(),
                request.details());
    }

    @GetMapping("/support/cases")
    public List<SupportViews.CaseSummary> cases(Authentication authentication) {
        return support.cases(Current.require(authentication));
    }

    @GetMapping("/support/cases/{id}")
    public SupportViews.CaseDetail caseDetail(Authentication authentication, @PathVariable UUID id) {
        return support.caseDetail(Current.require(authentication), id);
    }

    @PostMapping("/support/cases/{id}/messages")
    public SupportViews.MessageView message(
            Authentication authentication, @PathVariable UUID id, @RequestBody MessageRequest request) {
        return support.message(Current.require(authentication), id, request.text());
    }

    @PostMapping("/support/cases/{id}/claim")
    public SupportViews.CaseDetail claim(Authentication authentication, @PathVariable UUID id) {
        return support.claim(Current.require(authentication), id);
    }

    @PostMapping("/support/cases/{id}/resolve")
    public SupportViews.CaseDetail resolve(Authentication authentication, @PathVariable UUID id) {
        return support.resolve(Current.require(authentication), id);
    }

    public record FaqRequest(String question, String answer) {}

    public record FaqUpdate(String question, String answer, Boolean published) {}

    public record FaqOrder(List<UUID> ids) {}

    public record CaseRequest(String kind, String subject, String category, String details) {}

    public record MessageRequest(String text) {}
}
