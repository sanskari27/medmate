package com.medmate.servercore.identity;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class OtpMachineTest {
    @Test
    void cooldownAndLockoutMatchThePharmacyServer() {
        EnvNumbers.OtpSettings settings = new EnvNumbers.OtpSettings(6, 0, 2, 30_000, 5, 900_000);
        OtpMachine.Prepared first = OtpMachine.prepare(null, 1_000, settings);
        assertEquals("ok", first.error() == null ? "ok" : first.error());
        OtpMachine.Prepared again = OtpMachine.prepare(first.state(), 1_000 + 1_000, settings);
        assertEquals("cooldown", again.error());
        OtpMachine.Judged expired = OtpMachine.judge(first.state(), first.otp(), 1_000, 2);
        assertEquals("expired", expired.result());
    }
}
