package com.medmate.server.prep.web;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class PrepViews {

    private PrepViews() {}

    public record Summary(UUID id, String name, int lineCount, Instant updatedAt) {}

    public record Line(
            int position,
            String productId,
            String productName,
            String batchNo,
            String expiry,
            Integer qty,
            Integer free,
            BigDecimal rate,
            BigDecimal mrp,
            Integer gst) {}

    public record Detail(UUID id, String name, Instant updatedAt, List<Line> lines) {}

    public record Created(Summary list) {}

    public record Listed(List<Summary> lists) {}

    public record One(Detail list) {}
}
