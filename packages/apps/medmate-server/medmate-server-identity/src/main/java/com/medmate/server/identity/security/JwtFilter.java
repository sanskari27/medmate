package com.medmate.server.identity.security;

import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.BlockRules;
import com.medmate.server.identity.session.AccessTokens;
import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.shared.error.ProblemResponses;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

public class JwtFilter extends OncePerRequestFilter {

    private final AccessTokens tokens;
    private final AccountDirectory directory;
    private final Clock clock;

    public JwtFilter(AccessTokens tokens, AccountDirectory directory, Clock clock) {
        this.tokens = tokens;
        this.directory = directory;
        this.clock = clock;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getRequestURI().equals("/auth/admin-bootstrap")) {
            chain.doFilter(request, response);
            return;
        }
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }
        UUID accountId = tokens.parse(header.substring("Bearer ".length()).trim(), clock.instant());
        if (accountId == null) {
            ProblemResponses.write(
                    request, response, HttpStatus.UNAUTHORIZED, "Unauthorized", "Session was not accepted");
            return;
        }
        AccountPrincipal principal = directory.load(accountId);
        if (principal == null) {
            reject(request, response, "Session was not accepted");
            return;
        }
        if (isPost(request, "/auth/sign-out")) {
            authenticate(principal);
            chain.doFilter(request, response);
            return;
        }
        if (principal.disabled()) {
            if (BlockRules.restrictedOwnerSession(principal.accountType(), principal.pharmacyRole(), true)
                    && isPost(request, "/auth/refresh")) {
                authenticate(principal);
                chain.doFilter(request, response);
                return;
            }
            reject(request, response, "Session was not accepted");
            return;
        }
        if (BlockRules.staffOfRestrictedPharmacy(
                principal.accountType(), principal.pharmacyRole(), directory.ownerAccountDisabled(principal))) {
            reject(request, response, "This pharmacy is restricted.");
            return;
        }
        authenticate(principal);
        chain.doFilter(request, response);
    }

    private static boolean isPost(HttpServletRequest request, String path) {
        return "POST".equals(request.getMethod()) && path.equals(request.getRequestURI());
    }

    private static void authenticate(AccountPrincipal principal) {
        org.springframework.security.core.context.SecurityContextHolder.getContext()
                .setAuthentication(new AccountAuthentication(principal));
    }

    private static void reject(HttpServletRequest request, HttpServletResponse response, String detail)
            throws IOException {
        ProblemResponses.write(request, response, HttpStatus.UNAUTHORIZED, "Unauthorized", detail);
    }
}
