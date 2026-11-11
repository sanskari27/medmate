package com.medmate.server.identity.access;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class PlatformAccountsTest {

    @Test
    void oneAdminResolvesToAdmin() {
        assertThat(PlatformAccounts.sole(List.of(AccountType.ADMIN))).contains(AccountType.ADMIN);
    }

    @Test
    void oneStaffResolvesToStaff() {
        assertThat(PlatformAccounts.sole(List.of(AccountType.STAFF))).contains(AccountType.STAFF);
    }

    @Test
    void aPharmacyPhoneDoesNotResolve() {
        assertThat(PlatformAccounts.sole(List.of(AccountType.PHARMACY))).isEmpty();
        assertThat(PlatformAccounts.sole(List.of())).isEmpty();
    }

    @Test
    void bothAdminAndStaffDoNotResolve() {
        assertThat(PlatformAccounts.sole(List.of(AccountType.ADMIN, AccountType.STAFF)))
                .isEmpty();
    }
}
