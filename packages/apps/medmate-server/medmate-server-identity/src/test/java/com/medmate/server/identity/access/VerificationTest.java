package com.medmate.server.identity.access;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class VerificationTest {

    @Test
    void submissionStartsAndRestartsAtCompliance() {
        assertThat(Verification.submit(VerificationStatus.INCOMPLETE)).contains(VerificationStatus.PENDING_COMPLIANCE);
        assertThat(Verification.submit(VerificationStatus.REJECTED)).contains(VerificationStatus.PENDING_COMPLIANCE);
        assertThat(Verification.submit(VerificationStatus.PENDING_COMPLIANCE)).isEmpty();
        assertThat(Verification.submit(VerificationStatus.APPROVED)).isEmpty();
    }

    @Test
    void complianceThenAdminAreSeparateSteps() {
        assertThat(Verification.compliance(VerificationStatus.PENDING_COMPLIANCE, Verification.Decision.APPROVE))
                .contains(VerificationStatus.PENDING_ADMIN);
        assertThat(Verification.compliance(VerificationStatus.PENDING_COMPLIANCE, Verification.Decision.REJECT))
                .contains(VerificationStatus.REJECTED);
        assertThat(Verification.adminFinal(VerificationStatus.PENDING_COMPLIANCE, Verification.Decision.APPROVE))
                .isEmpty();
        assertThat(Verification.adminFinal(VerificationStatus.PENDING_ADMIN, Verification.Decision.APPROVE))
                .contains(VerificationStatus.APPROVED);
        assertThat(Verification.adminFinal(VerificationStatus.PENDING_ADMIN, Verification.Decision.REJECT))
                .contains(VerificationStatus.REJECTED);
    }
}
