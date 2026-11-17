package com.medmate.clinic.routing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.medmate.clinic.error.ApiProblem;
import com.medmate.clinic.security.ClinicPrincipal;
import com.medmate.clinic.security.ClinicTokenVerifier;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class ClinicRoutingTest {

    private static final UUID CLINIC_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    void registeredClinicResolvesToRegistryDatabase() {
        DataSource datasource = fakeDataSource();
        ClinicRegistry registry = clinicId -> Optional.of(new ClinicRegistryRow(clinicId, "clinic_one", "Clinic One"));
        ClinicRouting routing = new ClinicRouting(registry, (row, principal) -> datasource);

        DataSource resolved = routing.route(new ClinicPrincipal(UUID.randomUUID(), CLINIC_ID, "owner"));

        assertThat(resolved).isSameAs(datasource);
    }

    @Test
    void unknownClinicRaisesClinicUnavailable() {
        ClinicRegistry registry = clinicId -> Optional.empty();
        ClinicRouting routing = new ClinicRouting(registry, (row, principal) -> fakeDataSource());

        assertThatThrownBy(() -> routing.route(new ClinicPrincipal(UUID.randomUUID(), CLINIC_ID, "owner")))
                .isInstanceOf(ClinicUnavailableException.class)
                .hasMessage("Clinic records are unavailable");
    }

    @Test
    void unreachableClinicDatabaseRaisesClinicUnavailableWithoutFallback() {
        ClinicRegistry registry = clinicId -> Optional.of(new ClinicRegistryRow(clinicId, "clinic_one", "Clinic One"));
        ClinicRouting routing = new ClinicRouting(registry, (row, principal) -> {
            throw new RuntimeException("connection refused");
        });

        assertThatThrownBy(() -> routing.route(new ClinicPrincipal(UUID.randomUUID(), CLINIC_ID, "owner")))
                .isInstanceOf(ClinicUnavailableException.class)
                .hasMessage("Clinic records are unavailable");
    }

    @Test
    void bearerWithNoClinicIdClaimIsRejectedWith401() throws Exception {
        String secret = "01234567890123456789012345678901";
        ClinicTokenVerifier verifier = new ClinicTokenVerifier(secret);
        String token = tokenWithoutClinicId(secret, UUID.randomUUID(), Instant.parse("2026-11-17T00:00:00Z"));

        assertThatThrownBy(() -> verifier.verify("Bearer " + token, Instant.parse("2026-11-17T00:01:00Z")))
                .isInstanceOfSatisfying(ApiProblem.class, problem -> {
                    assertThat(problem.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(problem.title()).isEqualTo("Unauthorized");
                    assertThat(problem.getMessage()).isEqualTo("Session was not accepted");
                });
    }

    private static DataSource fakeDataSource() {
        return (DataSource) java.lang.reflect.Proxy.newProxyInstance(
                DataSource.class.getClassLoader(), new Class<?>[] {DataSource.class}, (proxy, method, args) -> {
                    if ("toString".equals(method.getName())) {
                        return "fakeDataSource";
                    }
                    throw new UnsupportedOperationException(method.getName());
                });
    }

    private static String tokenWithoutClinicId(String secret, UUID accountId, Instant now) throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(accountId.toString())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plusSeconds(3600)))
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(secret.getBytes(StandardCharsets.UTF_8)));
        return jwt.serialize();
    }
}
