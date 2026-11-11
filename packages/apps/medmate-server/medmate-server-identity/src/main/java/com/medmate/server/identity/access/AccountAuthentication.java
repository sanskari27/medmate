package com.medmate.server.identity.access;

import java.util.List;
import org.springframework.security.authentication.AbstractAuthenticationToken;

public final class AccountAuthentication extends AbstractAuthenticationToken {

    private final AccountPrincipal principal;

    public AccountAuthentication(AccountPrincipal principal) {
        super(List.of());
        this.principal = principal;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return "";
    }

    @Override
    public Object getPrincipal() {
        return principal;
    }
}
