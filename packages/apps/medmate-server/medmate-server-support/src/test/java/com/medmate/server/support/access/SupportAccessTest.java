package com.medmate.server.support.access;

import static org.assertj.core.api.Assertions.assertThat;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.StaffSubtype;
import com.medmate.server.identity.access.VerificationStatus;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class SupportAccessTest {

    private final UUID pharmacyId = UUID.fromString("00000000-0000-4000-8000-000000000301");
    private final UUID otherPharmacy = UUID.fromString("00000000-0000-4000-8000-000000000302");

    @Test
    void anApprovedOwnerUsesTheirOwnCasesAndCannotEditFaqs() {
        AccountPrincipal owner = principal(
                AccountType.PHARMACY, false, PharmacyRole.OWNER, VerificationStatus.APPROVED, pharmacyId, Set.of());

        assertThat(SupportAccess.faqs(owner)).isTrue();
        assertThat(SupportAccess.editFaqs(owner)).isFalse();
        assertThat(SupportAccess.createCase(owner)).isTrue();
        assertThat(SupportAccess.readCase(owner, pharmacyId)).isTrue();
        assertThat(SupportAccess.readCase(owner, otherPharmacy)).isFalse();
        assertThat(SupportAccess.reply(owner, pharmacyId)).isTrue();
        assertThat(SupportAccess.claim(owner)).isFalse();
        assertThat(SupportAccess.resolve(owner, pharmacyId)).isTrue();
        assertThat(SupportAccess.connect(owner)).isTrue();
    }

    @Test
    void pharmacyStaffAndAnUnapprovedOwnerCannotUseSupport() {
        AccountPrincipal staff = principal(
                AccountType.PHARMACY, false, PharmacyRole.STAFF, VerificationStatus.APPROVED, pharmacyId, Set.of());
        AccountPrincipal pending = principal(
                AccountType.PHARMACY,
                false,
                PharmacyRole.OWNER,
                VerificationStatus.PENDING_ADMIN,
                pharmacyId,
                Set.of());

        assertThat(SupportAccess.faqs(staff)).isFalse();
        assertThat(SupportAccess.createCase(staff)).isFalse();
        assertThat(SupportAccess.connect(staff)).isFalse();
        assertThat(SupportAccess.createCase(pending)).isFalse();
        assertThat(SupportAccess.faqs(pending)).isFalse();
    }

    @Test
    void adminReadsAndEditsFaqsButCannotClaimReplyOrResolve() {
        AccountPrincipal admin = principal(AccountType.ADMIN, false, null, null, null, Set.of());
        AccountPrincipal disabled = principal(AccountType.ADMIN, true, null, null, null, Set.of());

        assertThat(SupportAccess.editFaqs(admin)).isTrue();
        assertThat(SupportAccess.readCase(admin, pharmacyId)).isTrue();
        assertThat(SupportAccess.claim(admin)).isFalse();
        assertThat(SupportAccess.reply(admin, pharmacyId)).isFalse();
        assertThat(SupportAccess.resolve(admin, pharmacyId)).isFalse();
        assertThat(SupportAccess.createCase(admin)).isFalse();
        assertThat(SupportAccess.faqs(disabled)).isFalse();
    }

    @Test
    void supportCanClaimAndReplyAndOtherStaffCannot() {
        AccountPrincipal support = principal(AccountType.STAFF, false, null, null, null, Set.of(StaffSubtype.SUPPORT));
        AccountPrincipal finance = principal(AccountType.STAFF, false, null, null, null, Set.of(StaffSubtype.FINANCE));

        assertThat(SupportAccess.editFaqs(support)).isTrue();
        assertThat(SupportAccess.claim(support)).isTrue();
        assertThat(SupportAccess.reply(support, pharmacyId)).isTrue();
        assertThat(SupportAccess.resolve(support, otherPharmacy)).isTrue();
        assertThat(SupportAccess.createCase(support)).isFalse();
        assertThat(SupportAccess.faqs(finance)).isFalse();
        assertThat(SupportAccess.claim(finance)).isFalse();
        assertThat(SupportAccess.connect(finance)).isFalse();
    }

    private static AccountPrincipal principal(
            AccountType type,
            boolean disabled,
            PharmacyRole role,
            VerificationStatus status,
            UUID pharmacyId,
            Set<StaffSubtype> subtypes) {
        return new AccountPrincipal(
                UUID.randomUUID(),
                "919800000000",
                type,
                "Ada",
                disabled,
                pharmacyId,
                role,
                status,
                null,
                null,
                subtypes,
                Set.of(),
                true,
                null);
    }
}
