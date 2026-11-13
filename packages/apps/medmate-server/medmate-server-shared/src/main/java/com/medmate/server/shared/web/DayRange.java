package com.medmate.server.shared.web;

import com.medmate.server.shared.error.ApiProblem;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.http.HttpStatus;

public record DayRange(LocalDate from, LocalDate to) {

    public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    public static DayRange parse(String fromRaw, String toRaw) {
        LocalDate from = day(fromRaw);
        LocalDate to = day(toRaw);
        if (from != null && to != null && from.isAfter(to)) {
            throw invalid();
        }
        return new DayRange(from, to);
    }

    private static LocalDate day(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(raw.trim());
        } catch (DateTimeException exception) {
            throw invalid();
        }
    }

    private static ApiProblem invalid() {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "The date range is not valid.");
    }
}
