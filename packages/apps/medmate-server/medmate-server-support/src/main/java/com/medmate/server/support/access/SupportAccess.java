package com.medmate.server.support.access;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.StaffSubtype;
import com.medmate.server.identity.access.VerificationStatus;
import java.util.Set;
import java.util.UUID;

public final class SupportAccess {

    private SupportAccess() {}

    public static boolean faqs(AccountPrincipal principal) {
        return owner(principal) || admin(principal) || support(principal);
    }

    public static boolean editFaqs(AccountPrincipal principal) {
        return admin(principal) || support(principal);
    }

    public static boolean listCases(AccountPrincipal principal) {
        return faqs(principal);
    }

    public static boolean createCase(AccountPrincipal principal) {
        return owner(principal);
    }

    public static boolean readCase(AccountPrincipal principal, UUID pharmacyId) {
        if (admin(principal) || support(principal)) {
            return true;
        }
        return owner(principal) && pharmacyId != null && pharmacyId.equals(principal.pharmacyId());
    }

    public static boolean reply(AccountPrincipal principal, UUID pharmacyId) {
        if (support(principal)) {
            return true;
        }
        return owner(principal) && pharmacyId != null && pharmacyId.equals(principal.pharmacyId());
    }

    public static boolean claim(AccountPrincipal principal) {
        return support(principal);
    }

    public static boolean resolve(AccountPrincipal principal, UUID pharmacyId) {
        return reply(principal, pharmacyId);
    }

    public static boolean connect(AccountPrincipal principal) {
        return faqs(principal);
    }

    private static boolean owner(AccountPrincipal principal) {
        return active(principal)
                && principal.accountType() == AccountType.PHARMACY
                && principal.pharmacyRole() == PharmacyRole.OWNER
                && principal.verificationStatus() == VerificationStatus.APPROVED
                && principal.pharmacyId() != null;
    }

    private static boolean admin(AccountPrincipal principal) {
        return active(principal) && principal.accountType() == AccountType.ADMIN;
    }

    private static boolean support(AccountPrincipal principal) {
        if (!active(principal) || principal.accountType() != AccountType.STAFF) {
            return false;
        }
        Set<StaffSubtype> subtypes = principal.subtypes();
        return subtypes != null && subtypes.contains(StaffSubtype.SUPPORT);
    }

    private static boolean active(AccountPrincipal principal) {
        return principal != null && !principal.disabled();
    }
}
