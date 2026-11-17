package com.medmate.server.identity.session;

import static org.assertj.core.api.Assertions.assertThat;

import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
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
        AccessTokens.Tenant tenant = tokens.parseClaims(token, NOW);
        assertThat(tenant.clinicId()).isEqualTo(CLINIC_ID);
        assertThat(tenant.clinicRole()).isEqualTo("owner");
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
        AccessTokens.Tenant tenant = tokens.parseClaims(token, NOW);
        assertThat(tenant.clinicId()).isNull();
        assertThat(tenant.clinicRole()).isNull();
    }

    @Test
    void aTokenSignedWithAnotherSecretDoesNotParse() {
        UUID accountId = UUID.randomUUID();
        String token = tokens.issue(accountId, CLINIC_ID, "doctor", NOW);
        AccessTokens other = new AccessTokens("another-jwt-secret-another-jwt-secret", 900);

        assertThat(other.parse(token, NOW)).isNull();
        assertThat(other.parseClaims(token, NOW)).isNull();
    }
}
