package com.medmate.server.identity.web;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.shared.error.ApiProblem;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

public final class Current {

    private Current() {}

    public static AccountPrincipal require(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof AccountPrincipal principal) {
            return principal;
        }
        throw new ApiProblem(HttpStatus.UNAUTHORIZED, "Unauthorized", "Sign in is required");
    }
}
