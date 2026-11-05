package com.medmate.servercore;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class DeleteRejectedFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws java.io.IOException, jakarta.servlet.ServletException {
        if ("DELETE".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(403);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":{\"code\":\"FORBIDDEN\",\"message\":\"Records cannot be deleted\"}}");
            return;
        }
        chain.doFilter(request, response);
    }
}
