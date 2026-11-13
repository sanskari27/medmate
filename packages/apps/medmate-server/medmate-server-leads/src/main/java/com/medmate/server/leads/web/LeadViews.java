package com.medmate.server.leads.web;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class LeadViews {

    private LeadViews() {}

    public record Summary(
            UUID id,
            String site,
            String type,
            String status,
            String name,
            String phone,
            String email,
            Instant createdAt) {}

    public record Detail(
            UUID id,
            String site,
            String type,
            String status,
            Instant createdAt,
            String name,
            String phone,
            String email,
            String pharmacyName,
            String cityPincode,
            String area,
            String city,
            String preferredTime,
            String monthlySales,
            String subject,
            String message,
            String source,
            String notes,
            String plan,
            Boolean consent) {}

    public record ListResponse(List<Summary> leads, int page, int size, int total) {}

    public record One(Detail lead) {}
}
