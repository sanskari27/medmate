package com.medmate.clinic.error;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;

public final class RequestIds {

    public static final String HEADER = "X-Request-Id";
    public static final String ATTRIBUTE = "medmate.requestId";

    private RequestIds() {}

    public static String resolve(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return candidate.trim();
    }

    public static String from(HttpServletRequest request) {
        Object current = request.getAttribute(ATTRIBUTE);
        if (current instanceof String id && !id.isBlank()) {
            return id;
        }
        String resolved = resolve(request.getHeader(HEADER));
        request.setAttribute(ATTRIBUTE, resolved);
        return resolved;
    }
}
