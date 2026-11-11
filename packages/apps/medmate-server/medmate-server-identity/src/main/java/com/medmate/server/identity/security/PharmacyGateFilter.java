package com.medmate.server.identity.security;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.shared.error.ProblemResponses;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class PharmacyGateFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AccountPrincipal principal)) {
            chain.doFilter(request, response);
            return;
        }
        if (principal.accountType() != AccountType.PHARMACY
                || principal.verificationStatus() == VerificationStatus.APPROVED
                || allowed(request)) {
            chain.doFilter(request, response);
            return;
        }
        ProblemResponses.write(request, response, HttpStatus.FORBIDDEN, "Forbidden", "Pharmacy is not approved");
    }

    private static boolean allowed(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        if (path.startsWith("/auth/") || path.startsWith("/actuator/")) {
            return true;
        }
        if ("GET".equals(method) && "/pharmacy/verification".equals(path)) {
            return true;
        }
        if ("/pharmacy/application".equals(path) && ("GET".equals(method) || "POST".equals(method))) {
            return true;
        }
        return "GET".equals(method) && path.startsWith("/pharmacies/") && path.contains("/documents/");
    }
}
