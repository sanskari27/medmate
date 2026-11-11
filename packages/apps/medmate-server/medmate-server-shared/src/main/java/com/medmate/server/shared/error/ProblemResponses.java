package com.medmate.server.shared.error;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

public final class ProblemResponses {

    private static final ObjectMapper JSON = new ObjectMapper();

    private ProblemResponses() {}

    public static void write(
            HttpServletRequest request, HttpServletResponse response, HttpStatus status, String title, String detail)
            throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("type", "about:blank");
        body.put("title", title);
        body.put("status", status.value());
        body.put("detail", detail);
        body.put("requestId", requestId(request));
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        JSON.writeValue(response.getOutputStream(), body);
    }

    public static String requestId(HttpServletRequest request) {
        Object current = request.getAttribute(com.medmate.server.shared.web.RequestIds.ATTRIBUTE);
        if (current instanceof String id && !id.isBlank()) {
            return id;
        }
        return com.medmate.server.shared.web.RequestIds.resolve(
                request.getHeader(com.medmate.server.shared.web.RequestIds.HEADER));
    }
}
