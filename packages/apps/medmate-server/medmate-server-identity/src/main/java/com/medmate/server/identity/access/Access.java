package com.medmate.server.identity.access;

import java.util.Set;
import java.util.UUID;

public final class Access {

    private Access() {}

    public static boolean platform(AccountType type, boolean disabled, Set<StaffSubtype> subtypes, String module) {
        if (disabled || module == null) {
            return false;
        }
        if (type == AccountType.ADMIN) {
            return true;
        }
        if (type != AccountType.STAFF || subtypes == null) {
            return false;
        }
        return switch (module) {
            case "finance", "accounting" -> subtypes.contains(StaffSubtype.FINANCE);
            case "compliance" -> subtypes.contains(StaffSubtype.COMPLIANCE);
            case "sales" -> subtypes.contains(StaffSubtype.SALES);
            case "support" -> subtypes.contains(StaffSubtype.SUPPORT);
            default -> false;
        };
    }

    public static boolean pharmacy(
            AccountType type,
            boolean disabled,
            PharmacyRole role,
            UUID accountPharmacyId,
            UUID targetPharmacyId,
            VerificationStatus status,
            Set<String> permissions,
            String key) {
        if (disabled || type != AccountType.PHARMACY || status != VerificationStatus.APPROVED) {
            return false;
        }
        if (accountPharmacyId == null || !accountPharmacyId.equals(targetPharmacyId) || key == null) {
            return false;
        }
        if (role == PharmacyRole.OWNER) {
            return true;
        }
        return role == PharmacyRole.STAFF && permissions != null && permissions.contains(key);
    }

    public static boolean validKey(String key) {
        return PharmacyPermissions.valid(key);
    }
}
