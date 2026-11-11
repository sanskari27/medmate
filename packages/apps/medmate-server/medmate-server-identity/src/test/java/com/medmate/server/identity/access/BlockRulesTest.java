package com.medmate.server.identity.access;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import org.junit.jupiter.api.Test;

class BlockRulesTest {

    @Test
    void directoryReadersAreAdminAndAnyStaffSubtype() {
        assertThat(BlockRules.directoryReader(AccountType.ADMIN, false, Set.of()))
                .isTrue();
        assertThat(BlockRules.directoryReader(AccountType.ADMIN, true, Set.of()))
                .isFalse();
        assertThat(BlockRules.directoryReader(AccountType.STAFF, false, Set.of(StaffSubtype.FINANCE)))
                .isTrue();
        assertThat(BlockRules.directoryReader(AccountType.STAFF, false, Set.of(StaffSubtype.SUPPORT)))
                .isTrue();
        assertThat(BlockRules.directoryReader(AccountType.STAFF, false, Set.of()))
                .isFalse();
        assertThat(BlockRules.directoryReader(AccountType.PHARMACY, false, Set.of()))
                .isFalse();
        assertThat(BlockRules.directoryReader(AccountType.CUSTOMER, false, Set.of()))
                .isFalse();
    }

    @Test
    void onlyStaffFileARequestAndOnlyAdminDecides() {
        assertThat(BlockRules.canRequest(AccountType.STAFF, false, Set.of(StaffSubtype.SALES)))
                .isTrue();
        assertThat(BlockRules.canRequest(AccountType.ADMIN, false, Set.of())).isFalse();
        assertThat(BlockRules.canRequest(AccountType.STAFF, true, Set.of(StaffSubtype.SALES)))
                .isFalse();
        assertThat(BlockRules.canDecide(AccountType.ADMIN, false)).isTrue();
        assertThat(BlockRules.canDecide(AccountType.ADMIN, true)).isFalse();
        assertThat(BlockRules.canDecide(AccountType.STAFF, false)).isFalse();
    }

    @Test
    void blockStatePrefersDisabledOverAnOpenRequest() {
        assertThat(BlockRules.State.of(true, true)).isEqualTo(BlockRules.State.BLOCKED);
        assertThat(BlockRules.State.of(true, false)).isEqualTo(BlockRules.State.BLOCKED);
        assertThat(BlockRules.State.of(false, true)).isEqualTo(BlockRules.State.REQUESTED);
        assertThat(BlockRules.State.of(false, false)).isEqualTo(BlockRules.State.CLEAR);
        assertThat(BlockRules.State.REQUESTED.wire()).isEqualTo("requested");
    }

    @Test
    void oneOpenRequestBlocksAnotherAndADirectBlock() {
        assertThat(BlockRules.request(false, false)).isEqualTo(BlockRules.Outcome.ALLOWED);
        assertThat(BlockRules.request(false, true)).isEqualTo(BlockRules.Outcome.REQUEST_OPEN);
        assertThat(BlockRules.request(true, false)).isEqualTo(BlockRules.Outcome.ALREADY_BLOCKED);
        assertThat(BlockRules.directBlock(false, true)).isEqualTo(BlockRules.Outcome.REQUEST_OPEN);
        assertThat(BlockRules.directBlock(true, false)).isEqualTo(BlockRules.Outcome.ALREADY_BLOCKED);
        assertThat(BlockRules.directBlock(false, false)).isEqualTo(BlockRules.Outcome.ALLOWED);
        assertThat(BlockRules.unblock(true)).isEqualTo(BlockRules.Outcome.ALLOWED);
        assertThat(BlockRules.unblock(false)).isEqualTo(BlockRules.Outcome.NOT_BLOCKED);
        assertThat(BlockRules.decide(true)).isEqualTo(BlockRules.Outcome.ALLOWED);
        assertThat(BlockRules.decide(false)).isEqualTo(BlockRules.Outcome.NOT_OPEN);
        assertThat(BlockRules.reason("  ")).isNull();
        assertThat(BlockRules.reason(" Missing licence ")).isEqualTo("Missing licence");
    }

    @Test
    void aDisabledOwnerMayHoldASessionAndTheirStaffMayNot() {
        assertThat(BlockRules.restrictedOwnerSession(AccountType.PHARMACY, PharmacyRole.OWNER, true))
                .isTrue();
        assertThat(BlockRules.restrictedOwnerSession(AccountType.PHARMACY, PharmacyRole.OWNER, false))
                .isFalse();
        assertThat(BlockRules.restrictedOwnerSession(AccountType.PHARMACY, PharmacyRole.STAFF, true))
                .isFalse();
        assertThat(BlockRules.restrictedOwnerSession(AccountType.STAFF, PharmacyRole.OWNER, true))
                .isFalse();
        assertThat(BlockRules.staffOfRestrictedPharmacy(AccountType.PHARMACY, PharmacyRole.STAFF, true))
                .isTrue();
        assertThat(BlockRules.staffOfRestrictedPharmacy(AccountType.PHARMACY, PharmacyRole.STAFF, false))
                .isFalse();
        assertThat(BlockRules.staffOfRestrictedPharmacy(AccountType.PHARMACY, PharmacyRole.OWNER, true))
                .isFalse();
    }
}
