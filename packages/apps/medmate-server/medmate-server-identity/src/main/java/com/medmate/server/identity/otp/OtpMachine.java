package com.medmate.server.identity.otp;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;

public final class OtpMachine {

    public static final int MAX_ATTEMPTS = 5;
    public static final Duration TTL = Duration.ofMinutes(5);

    public enum Verdict {
        OK,
        EXPIRED,
        TOO_MANY,
        MISMATCH
    }

    public record State(String codeHash, Instant expiresAt, int attempts) {}

    private OtpMachine() {}

    public static State issue(String codeHash, Instant now) {
        return new State(codeHash, now.plus(TTL), 0);
    }

    public static Verdict judge(State state, String presentedHash, Instant now) {
        if (state.attempts() >= MAX_ATTEMPTS) {
            return Verdict.TOO_MANY;
        }
        if (!now.isBefore(state.expiresAt())) {
            return Verdict.EXPIRED;
        }
        byte[] expected = state.codeHash().getBytes(StandardCharsets.UTF_8);
        byte[] presented = presentedHash.getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, presented)) {
            return Verdict.MISMATCH;
        }
        return Verdict.OK;
    }
}
