package com.medmate.todo;

import java.time.Instant;
import java.util.UUID;

public record TodoResponse(
        UUID id,
        String title,
        boolean completed,
        boolean attachment,
        Instant createdAt
) {
}
