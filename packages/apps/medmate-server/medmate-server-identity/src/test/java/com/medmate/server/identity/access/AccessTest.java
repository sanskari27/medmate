package com.medmate.server.identity.access;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AccessTest {

    private final UUID pharmacyId = UUID.fromString("00000000-0000-4000-8000-000000000001");

    @Test
    void adminCoversEveryModuleAndASubtypeCoversOnlyItsOwn() {
        assertThat(Access.platform(AccountType.ADMIN, false, Set.of(), "finance"))
                .isTrue();
        assertThat(Access.platform(AccountType.ADMIN, true, Set.of(), "finance"))
                .isFalse();
        assertThat(Access.platform(AccountType.STAFF, false, Set.of(StaffSubtype.FINANCE), "finance"))
                .isTrue();
        assertThat(Access.platform(AccountType.STAFF, false, Set.of(StaffSubtype.FINANCE), "accounting"))
                .isTrue();
        assertThat(Access.platform(AccountType.STAFF, false, Set.of(StaffSubtype.FINANCE), "compliance"))
                .isFalse();
        assertThat(Access.platform(
                        AccountType.STAFF, false, Set.of(StaffSubtype.FINANCE, StaffSubtype.COMPLIANCE), "compliance"))
                .isTrue();
        assertThat(Access.platform(AccountType.STAFF, false, Set.of(StaffSubtype.SALES), "sales"))
                .isTrue();
        assertThat(Access.platform(AccountType.STAFF, false, Set.of(StaffSubtype.SUPPORT), "support"))
                .isTrue();
    }

    @Test
    void pharmacyKeysApplyToAnApprovedOwnerAndGrantedStaff() {
        assertThat(pharmacy(PharmacyRole.OWNER, VerificationStatus.APPROVED, Set.of(), "billing:create"))
                .isTrue();
        assertThat(pharmacy(PharmacyRole.OWNER, VerificationStatus.PENDING_ADMIN, Set.of(), "billing:create"))
                .isFalse();
        assertThat(pharmacy(
                        PharmacyRole.STAFF, VerificationStatus.APPROVED, Set.of("inventory:read"), "inventory:read"))
                .isTrue();
        assertThat(pharmacy(
                        PharmacyRole.STAFF, VerificationStatus.APPROVED, Set.of("inventory:read"), "billing:create"))
                .isFalse();
        assertThat(Access.validKey("inventory:read")).isTrue();
        assertThat(Access.validKey("Inventory:Read")).isFalse();
    }

    private boolean pharmacy(PharmacyRole role, VerificationStatus status, Set<String> keys, String key) {
        return Access.pharmacy(AccountType.PHARMACY, false, role, pharmacyId, pharmacyId, status, keys, key);
    }
}
