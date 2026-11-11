package com.medmate.server.identity.security;

import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
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
        if (principal == null || principal.disabled()) {
            ProblemResponses.write(
                    request, response, HttpStatus.UNAUTHORIZED, "Unauthorized", "Session was not accepted");
            return;
        }
        org.springframework.security.core.context.SecurityContextHolder.getContext()
                .setAuthentication(new AccountAuthentication(principal));
        chain.doFilter(request, response);
    }
}
