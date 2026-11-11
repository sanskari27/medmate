package com.medmate.server.identity.access;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Picks the single admin or staff account for a phone. */
public final class PlatformAccounts {

    private PlatformAccounts() {}

    public static Optional<AccountType> sole(List<AccountType> types) {
        List<AccountType> platform = new ArrayList<>();
        if (types != null) {
            for (AccountType type : types) {
                if (type == AccountType.ADMIN || type == AccountType.STAFF) {
                    platform.add(type);
                }
            }
        }
        if (platform.size() != 1) {
            return Optional.empty();
        }
        return Optional.of(platform.get(0));
    }
}
