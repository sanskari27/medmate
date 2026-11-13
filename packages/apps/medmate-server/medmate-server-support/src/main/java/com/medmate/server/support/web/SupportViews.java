package com.medmate.server.support.web;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class SupportViews {

    private SupportViews() {}

    public record FaqView(UUID id, String question, String answer, int position, boolean published) {}

    public record MessageView(UUID id, UUID authorId, String authorName, String body, Instant createdAt) {}

    public record CaseSummary(
            UUID id,
            String ticketNumber,
            UUID pharmacyId,
            String pharmacyName,
            String subject,
            String category,
            String status,
            UUID assigneeId,
            String assigneeName,
            Instant createdAt,
            Instant resolvedAt) {}

    public record CaseDetail(
            UUID id,
            String ticketNumber,
            UUID pharmacyId,
            String pharmacyName,
            String subject,
            String category,
            String status,
            UUID assigneeId,
            String assigneeName,
            Instant createdAt,
            Instant resolvedAt,
            List<MessageView> messages) {}

    public record CaseList(List<CaseSummary> cases, int page, int size, int total) {}
}
