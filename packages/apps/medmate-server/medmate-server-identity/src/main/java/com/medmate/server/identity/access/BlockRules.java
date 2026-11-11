package com.medmate.server.identity.access;

import java.util.Locale;
import java.util.Set;

public final class BlockRules {

    public enum State {
        CLEAR,
        REQUESTED,
        BLOCKED;

        public String wire() {
            return name().toLowerCase(Locale.ROOT);
        }

        public static State of(boolean ownerDisabled, boolean openRequest) {
            if (ownerDisabled) {
                return BLOCKED;
            }
            if (openRequest) {
                return REQUESTED;
            }
            return CLEAR;
        }
    }

    public enum Outcome {
        ALLOWED,
        ALREADY_BLOCKED,
        REQUEST_OPEN,
        NOT_BLOCKED,
        NOT_OPEN
    }

    private BlockRules() {}

    public static boolean directoryReader(AccountType type, boolean disabled, Set<StaffSubtype> subtypes) {
        if (disabled || type == null) {
            return false;
        }
        if (type == AccountType.ADMIN) {
            return true;
        }
        return type == AccountType.STAFF && subtypes != null && !subtypes.isEmpty();
    }

    public static boolean canRequest(AccountType type, boolean disabled, Set<StaffSubtype> subtypes) {
        return type == AccountType.STAFF && directoryReader(type, disabled, subtypes);
    }

    public static boolean canDecide(AccountType type, boolean disabled) {
        return type == AccountType.ADMIN && !disabled;
    }

    public static boolean restrictedOwnerSession(AccountType type, PharmacyRole role, boolean disabled) {
        return disabled && type == AccountType.PHARMACY && role == PharmacyRole.OWNER;
    }

    public static boolean staffOfRestrictedPharmacy(AccountType type, PharmacyRole role, boolean ownerDisabled) {
        return type == AccountType.PHARMACY && role == PharmacyRole.STAFF && ownerDisabled;
    }

    public static Outcome request(boolean ownerDisabled, boolean openRequest) {
        if (ownerDisabled) {
            return Outcome.ALREADY_BLOCKED;
        }
        if (openRequest) {
            return Outcome.REQUEST_OPEN;
        }
        return Outcome.ALLOWED;
    }

    public static Outcome directBlock(boolean ownerDisabled, boolean openRequest) {
        if (ownerDisabled) {
            return Outcome.ALREADY_BLOCKED;
        }
        if (openRequest) {
            return Outcome.REQUEST_OPEN;
        }
        return Outcome.ALLOWED;
    }

    public static Outcome unblock(boolean ownerDisabled) {
        return ownerDisabled ? Outcome.ALLOWED : Outcome.NOT_BLOCKED;
    }

    public static Outcome decide(boolean openRequest) {
        return openRequest ? Outcome.ALLOWED : Outcome.NOT_OPEN;
    }

    public static String reason(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
