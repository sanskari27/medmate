package com.medmate.server.identity.otp;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.Test;

class OtpMachineTest {

    private final Instant now = Instant.parse("2026-11-11T10:00:00Z");

    @Test
    void acceptsTheIssuedCodeBeforeItExpires() {
        OtpMachine.State state = OtpMachine.issue("hash", now);

        assertThat(state.expiresAt()).isEqualTo(now.plus(OtpMachine.TTL));
        assertThat(OtpMachine.judge(state, "hash", now.plusSeconds(30))).isEqualTo(OtpMachine.Verdict.OK);
    }

    @Test
    void rejectsAMismatchAnExpiredCodeAndTooManyChecks() {
        OtpMachine.State state = OtpMachine.issue("hash", now);

        assertThat(OtpMachine.judge(state, "other", now)).isEqualTo(OtpMachine.Verdict.MISMATCH);
        assertThat(OtpMachine.judge(state, "hash", now.plus(OtpMachine.TTL))).isEqualTo(OtpMachine.Verdict.EXPIRED);
        OtpMachine.State locked = new OtpMachine.State("hash", now.plus(OtpMachine.TTL), OtpMachine.MAX_ATTEMPTS);
        assertThat(OtpMachine.judge(locked, "hash", now)).isEqualTo(OtpMachine.Verdict.TOO_MANY);
    }
}
