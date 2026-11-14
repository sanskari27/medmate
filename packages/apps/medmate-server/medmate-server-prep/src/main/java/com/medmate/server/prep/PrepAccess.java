package com.medmate.server.prep;

import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;

public final class PrepAccess {

    private PrepAccess() {}

    public static boolean open(AccountPrincipal principal) {
        if (principal == null) {
            return false;
        }
        return Access.platform(principal.accountType(), principal.disabled(), principal.subtypes(), "sales");
    }
}
