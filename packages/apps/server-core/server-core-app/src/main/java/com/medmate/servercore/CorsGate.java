package com.medmate.servercore;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.net.URI;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsGate extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws java.io.IOException, jakarta.servlet.ServletException {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            if (!allowed(origin)) {
                response.setStatus(403);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":{\"code\":\"FORBIDDEN\",\"message\":\"Origin is not allowed\"}}");
                return;
            }
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Vary", "Origin");
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, x-pricing-unlock, Authorization");
            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                response.setStatus(204);
                return;
            }
        }
        chain.doFilter(request, response);
    }

    static boolean allowed(String origin) {
        try {
            URI uri = URI.create(origin);
            String host = uri.getHost();
            if (host == null) {
                return false;
            }
            if ("http".equalsIgnoreCase(uri.getScheme()) && "localhost".equalsIgnoreCase(host)) {
                return true;
            }
            if (!"https".equalsIgnoreCase(uri.getScheme())) {
                return false;
            }
            return host.equals("nammamedmate.com") || host.endsWith(".nammamedmate.com")
                    || host.equals("medmatepharmacy.com") || host.endsWith(".medmatepharmacy.com");
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
