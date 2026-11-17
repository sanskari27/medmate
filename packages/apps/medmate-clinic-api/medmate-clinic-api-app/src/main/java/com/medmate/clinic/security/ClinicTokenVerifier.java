package com.medmate.clinic.security;

import com.medmate.clinic.error.ApiProblem;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class ClinicTokenVerifier {

    private final byte[] secret;

    public ClinicTokenVerifier(@Value("${medmate.jwt.secret}") String secret) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public ClinicPrincipal verify(String bearer, Instant now) {
        String token = extract(bearer);
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!jwt.verify(new MACVerifier(secret))) {
                throw unauthorized();
            }
            JWTClaimsSet claims = jwt.getJWTClaimsSet();
            Date expiration = claims.getExpirationTime();
            if (expiration == null || !expiration.toInstant().isAfter(now)) {
                throw unauthorized();
            }
            UUID accountId = UUID.fromString(claims.getSubject());

            String clinicIdClaim = stringClaim(claims, "clinicId");
            String clinicRoleClaim = stringClaim(claims, "clinicRole");
            if (clinicIdClaim == null || clinicRoleClaim == null) {
                throw unauthorized();
            }
            UUID clinicId = UUID.fromString(clinicIdClaim);
            return new ClinicPrincipal(accountId, clinicId, clinicRoleClaim);
        } catch (ApiProblem problem) {
            throw problem;
        } catch (Exception exception) {
            throw unauthorized();
        }
    }

    private static String extract(String bearer) {
        if (bearer == null || bearer.isBlank()) {
            throw unauthorized();
        }
        String value = bearer.trim();
        if (value.regionMatches(true, 0, "Bearer ", 0, 7)) {
            value = value.substring(7).trim();
        }
        if (value.isEmpty()) {
            throw unauthorized();
        }
        return value;
    }

    private static String stringClaim(JWTClaimsSet claims, String name) {
        Object value = claims.getClaim(name);
        if (value instanceof String text && !text.isBlank()) {
            return text;
        }
        return null;
    }

    private static ApiProblem unauthorized() {
        return new ApiProblem(HttpStatus.UNAUTHORIZED, "Unauthorized", "Session was not accepted");
    }
}
