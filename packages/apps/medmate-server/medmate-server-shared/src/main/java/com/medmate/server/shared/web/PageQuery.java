package com.medmate.server.shared.web;

import com.medmate.server.shared.error.ApiProblem;
import java.util.Locale;
import org.springframework.http.HttpStatus;

public record PageQuery(int page, int size) {

    public static final int DEFAULT_SIZE = 25;
    public static final int MAX_SIZE = 100;

    public int offset() {
        return (page - 1) * size;
    }

    public static PageQuery parse(String page, String size) {
        int parsedPage = whole(page, 1);
        int parsedSize = whole(size, DEFAULT_SIZE);
        if (parsedPage < 1 || parsedSize < 1 || parsedSize > MAX_SIZE) {
            throw invalid();
        }
        return new PageQuery(parsedPage, parsedSize);
    }

    public static String needle(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().toLowerCase(Locale.ROOT);
    }

    public static String like(String raw) {
        String needle = needle(raw);
        if (needle.isEmpty()) {
            return "";
        }
        return "%" + needle.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }

    private static int whole(String raw, int fallback) {
        if (raw == null) {
            return fallback;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            throw invalid();
        }
        try {
            return Integer.parseInt(trimmed);
        } catch (NumberFormatException exception) {
            throw invalid();
        }
    }

    private static ApiProblem invalid() {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Page is not valid");
    }
}
