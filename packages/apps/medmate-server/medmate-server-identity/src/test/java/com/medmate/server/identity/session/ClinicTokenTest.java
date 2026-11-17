package com.medmate.server.identity.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.store.IdentityStore;
import com.medmate.server.identity.web.SessionIssuer;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ClinicTokenTest {

    private static final String SECRET = "test-jwt-secret-test-jwt-secret-32";
    private static final Instant NOW = Instant.parse("2026-11-17T00:00:00Z");
    private static final UUID CLINIC_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private final AccessTokens tokens = new AccessTokens(SECRET, 900);

    @Test
    void aClinicTokenCarriesTheTenant() throws Exception {
        UUID accountId = UUID.randomUUID();

        String token = tokens.issue(accountId, CLINIC_ID, "owner", NOW);

        assertThat(tokens.parse(token, NOW)).isEqualTo(accountId);
        assertThat(SignedJWT.parse(token).getJWTClaimsSet().getClaim("clinicId").toString())
                .isEqualTo(CLINIC_ID.toString());
        assertThat(SignedJWT.parse(token).getJWTClaimsSet().getClaim("clinicRole"))
                .isEqualTo("owner");
    }

    @Test
    void aTokenWithoutAClinicCarriesNoTenantClaim() throws Exception {
        UUID accountId = UUID.randomUUID();

        String token = tokens.issue(accountId, NOW);

        assertThat(tokens.parse(token, NOW)).isEqualTo(accountId);
        assertThat(SignedJWT.parse(token).getJWTClaimsSet().getClaim("clinicId"))
                .isNull();
        assertThat(SignedJWT.parse(token).getJWTClaimsSet().getClaim("clinicRole"))
                .isNull();
    }

    @Test
    void aClinicSessionTokenCarriesTheTenant() throws Exception {
        UUID accountId = UUID.randomUUID();

        String token = sessions()
                .issue(principal(accountId, AccountType.CLINIC, CLINIC_ID, "owner"), NOW)
                .accessToken();

        assertThat(SignedJWT.parse(token).getJWTClaimsSet().getClaim("clinicId").toString())
                .isEqualTo(CLINIC_ID.toString());
        assertThat(SignedJWT.parse(token).getJWTClaimsSet().getClaim("clinicRole"))
                .isEqualTo("owner");
    }

    @Test
    void aPharmacySessionTokenCarriesNoTenantClaim() throws Exception {
        UUID accountId = UUID.randomUUID();

        String token = sessions()
                .issue(principal(accountId, AccountType.PHARMACY, null, null), NOW)
                .accessToken();

        assertThat(SignedJWT.parse(token).getJWTClaimsSet().getClaim("clinicId"))
                .isNull();
        assertThat(SignedJWT.parse(token).getJWTClaimsSet().getClaim("clinicRole"))
                .isNull();
    }

    @Test
    void anAdminSessionTokenCarriesNoTenantClaim() throws Exception {
        UUID accountId = UUID.randomUUID();

        String token = sessions()
                .issue(principal(accountId, AccountType.ADMIN, null, null), NOW)
                .accessToken();

        assertThat(SignedJWT.parse(token).getJWTClaimsSet().getClaim("clinicId"))
                .isNull();
        assertThat(SignedJWT.parse(token).getJWTClaimsSet().getClaim("clinicRole"))
                .isNull();
    }

    @Test
    void aClinicIdWithoutAClinicRoleIsRejected() {
        UUID accountId = UUID.randomUUID();

        assertThatThrownBy(() -> tokens.issue(accountId, CLINIC_ID, null, NOW))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("clinicRole is required when clinicId is present");
    }

    @Test
    void aClinicRoleWithoutAClinicIdIsRejected() {
        UUID accountId = UUID.randomUUID();

        assertThatThrownBy(() -> tokens.issue(accountId, null, "owner", NOW))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("clinicId is required when clinicRole is present");
    }

    @Test
    void aTokenSignedWithAnotherSecretDoesNotParse() {
        UUID accountId = UUID.randomUUID();
        String token = tokens.issue(accountId, CLINIC_ID, "doctor", NOW);
        AccessTokens other = new AccessTokens("another-jwt-secret-another-jwt-secret", 900);

        assertThat(other.parse(token, NOW)).isNull();
    }

    private SessionIssuer sessions() {
        IdentityStore accounts = new IdentityStore(null) {
            @Override
            public void insertRefresh(String tokenHash, UUID accountId, Instant expiresAt) {}
        };
        return new SessionIssuer(accounts, tokens, 900, 2592000);
    }

    private static AccountPrincipal principal(UUID accountId, AccountType type, UUID clinicId, String clinicRole) {
        return new AccountPrincipal(
                accountId,
                "+919800000000",
                type,
                "Ada",
                false,
                null,
                null,
                null,
                null,
                null,
                Set.of(),
                Set.of(),
                false,
                null,
                clinicId,
                clinicRole);
    }
}
