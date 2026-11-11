package com.medmate.server.identity.access;

import java.util.Optional;

public final class Verification {

    public enum Decision {
        APPROVE,
        REJECT;

        public static Decision parse(String raw) {
            if (raw == null || raw.isBlank()) {
                return null;
            }
            try {
                return valueOf(raw.trim().toUpperCase(java.util.Locale.ROOT));
            } catch (IllegalArgumentException exception) {
                return null;
            }
        }
    }

    private Verification() {}

    public static Optional<VerificationStatus> submit(VerificationStatus current) {
        if (current == VerificationStatus.INCOMPLETE || current == VerificationStatus.REJECTED) {
            return Optional.of(VerificationStatus.PENDING_COMPLIANCE);
        }
        return Optional.empty();
    }

    public static Optional<VerificationStatus> compliance(VerificationStatus current, Decision decision) {
        if (current != VerificationStatus.PENDING_COMPLIANCE) {
            return Optional.empty();
        }
        if (decision == Decision.APPROVE) {
            return Optional.of(VerificationStatus.PENDING_ADMIN);
        }
        return Optional.of(VerificationStatus.REJECTED);
    }

    public static Optional<VerificationStatus> adminFinal(VerificationStatus current, Decision decision) {
        if (current != VerificationStatus.PENDING_ADMIN) {
            return Optional.empty();
        }
        if (decision == Decision.APPROVE) {
            return Optional.of(VerificationStatus.APPROVED);
        }
        return Optional.of(VerificationStatus.REJECTED);
    }
}
