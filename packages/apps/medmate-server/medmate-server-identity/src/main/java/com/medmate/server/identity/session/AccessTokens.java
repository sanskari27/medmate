package com.medmate.server.identity.session;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

public final class AccessTokens {

    private final byte[] secret;
    private final long accessSeconds;

    public AccessTokens(String secret, long accessSeconds) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 bytes");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.accessSeconds = accessSeconds;
    }

    public String issue(UUID accountId, Instant now) {
        try {
            JWTClaimsSet claims = new JWTClaimsSet.Builder()
                    .subject(accountId.toString())
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(now.plusSeconds(accessSeconds)))
                    .build();
            SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            jwt.sign(new MACSigner(secret));
            return jwt.serialize();
        } catch (Exception exception) {
            throw new IllegalStateException("Could not sign the access token", exception);
        }
    }

    public UUID parse(String token, Instant now) {
        try {
            SignedJWT jwt = SignedJWT.parse(token);
            if (!jwt.verify(new MACVerifier(secret))) {
                return null;
            }
            Date expiration = jwt.getJWTClaimsSet().getExpirationTime();
            if (expiration == null || !expiration.toInstant().isAfter(now)) {
                return null;
            }
            return UUID.fromString(jwt.getJWTClaimsSet().getSubject());
        } catch (Exception exception) {
            return null;
        }
    }
}
