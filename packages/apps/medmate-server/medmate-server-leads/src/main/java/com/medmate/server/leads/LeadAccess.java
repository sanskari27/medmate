package com.medmate.server.leads;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.StaffSubtype;
import java.util.Set;

public final class LeadAccess {

    private LeadAccess() {}

    public static boolean read(AccountPrincipal principal) {
        if (principal == null || principal.disabled()) {
            return false;
        }
        if (principal.accountType() == AccountType.ADMIN) {
            return true;
        }
        if (principal.accountType() != AccountType.STAFF) {
            return false;
        }
        Set<StaffSubtype> subtypes = principal.subtypes();
        return subtypes != null && subtypes.contains(StaffSubtype.SUPPORT);
    }
}
