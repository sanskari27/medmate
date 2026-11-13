package com.medmate.server.shared.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.medmate.server.shared.error.ApiProblem;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class DayRangeTest {

    @Test
    void anEmptyRangeHasNoLimit() {
        DayRange range = DayRange.parse(null, "  ");
        assertThat(range.from()).isNull();
        assertThat(range.to()).isNull();
    }

    @Test
    void oneSideMayBeOpen() {
        DayRange range = DayRange.parse("2025-05-13", null);
        assertThat(range.from()).isEqualTo(LocalDate.parse("2025-05-13"));
        assertThat(range.to()).isNull();
    }

    @Test
    void rejectsAReversedOrUnreadableRange() {
        assertThatThrownBy(() -> DayRange.parse("2026-01-02", "2026-01-01"))
                .isInstanceOf(ApiProblem.class)
                .hasMessage("The date range is not valid.");
        assertThatThrownBy(() -> DayRange.parse("13-05-2025", null)).isInstanceOf(ApiProblem.class);
    }
}
