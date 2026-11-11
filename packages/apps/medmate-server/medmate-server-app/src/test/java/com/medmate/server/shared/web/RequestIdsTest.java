package com.medmate.server.shared.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RequestIdsTest {

    @Test
    void keepsASafeIncomingId() {
        assertThat(RequestIds.resolve("req-example-001")).isEqualTo("req-example-001");
    }

    @Test
    void replacesAMissingId() {
        assertThat(RequestIds.resolve(null)).matches("[0-9a-f-]{36}");
    }

    @Test
    void replacesAnEmptyId() {
        assertThat(RequestIds.resolve("")).matches("[0-9a-f-]{36}");
    }

    @Test
    void replacesAnUnsafeId() {
        assertThat(RequestIds.resolve("not safe")).matches("[0-9a-f-]{36}");
        assertThat(RequestIds.resolve("a".repeat(65))).matches("[0-9a-f-]{36}");
    }
}
