package com.medmate.server.identity.access;

public final class PinRules {

    private PinRules() {}

    public static boolean signIn(
            AccountType type, boolean disabled, boolean pinSet, PharmacyRole role, VerificationStatus status) {
        if (type == AccountType.CLINIC) {
            return !disabled && pinSet;
        }
        if (type != AccountType.PHARMACY || !pinSet) {
            return false;
        }
        if (disabled && role != PharmacyRole.OWNER) {
            return false;
        }
        if (status != VerificationStatus.APPROVED) {
            return false;
        }
        return role == PharmacyRole.OWNER || role == PharmacyRole.STAFF;
    }

    public static boolean setupRequired(
            AccountType type, boolean disabled, boolean pinSet, PharmacyRole role, VerificationStatus status) {
        if (type == AccountType.CLINIC) {
            return !disabled && !pinSet;
        }
        return type == AccountType.PHARMACY
                && role == PharmacyRole.OWNER
                && status == VerificationStatus.APPROVED
                && !pinSet;
    }

    public static boolean setupAllowed(
            AccountType type, boolean disabled, PharmacyRole role, VerificationStatus status) {
        if (disabled) {
            return false;
        }
        if (type == AccountType.CLINIC) {
            return true;
        }
        return type == AccountType.PHARMACY && role == PharmacyRole.OWNER && status == VerificationStatus.APPROVED;
    }
}
