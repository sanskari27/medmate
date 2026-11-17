package com.medmate.server.identity.access;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.identity.store.IdentityStore;
import com.medmate.server.identity.store.PharmacyStore;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ClinicAccountRulesTest {

    private static final UUID CLINIC_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Test
    void clinicRolesUseTheirOwnWireValues() {
        assertThat(ClinicRole.OWNER.wire()).isEqualTo("owner");
        assertThat(ClinicRole.DOCTOR.wire()).isEqualTo("doctor");
        assertThat(ClinicRole.NURSE.wire()).isEqualTo("nurse");
        assertThat(ClinicRole.FRONT_DESK.wire()).isEqualTo("front_desk");
        assertThat(ClinicRole.ADMIN.wire()).isEqualTo("admin");
    }

    @Test
    void clinicGrantKeysCannotBePharmacyKeys() {
        assertThat(ClinicPermissions.valid("clinic:patients:read")).isTrue();
        assertThat(ClinicPermissions.valid("clinic:patients:read_clinical")).isTrue();
        assertThat(ClinicPermissions.valid("clinic:billing:read")).isTrue();
        assertThat(ClinicPermissions.valid("clinic:staff:read")).isTrue();
        assertThat(ClinicPermissions.valid("patients:read")).isFalse();
        assertThat(PharmacyPermissions.valid("patients:read")).isTrue();
        assertThat(PharmacyPermissions.valid("clinic:patients:read")).isFalse();
    }

    @Test
    void theClinicAccountTypeParsesFromTheWireValue() {
        assertThat(AccountType.parse("clinic")).isEqualTo(AccountType.CLINIC);
        assertThat(AccountType.CLINIC.wire()).isEqualTo("clinic");
    }

    @Test
    void aClinicAccountResolvesToItsTenant() {
        UUID accountId = UUID.randomUUID();
        IdentityStore.AccountRow row = new IdentityStore.AccountRow(
                accountId, "919845012345", AccountType.CLINIC, "Dr. Ananya Rao", false, CLINIC_ID, "owner");

        AccountPrincipal principal = directory(accountId).load(row);

        assertThat(principal.accountType()).isEqualTo(AccountType.CLINIC);
        assertThat(principal.clinicId()).isEqualTo(CLINIC_ID);
        assertThat(principal.clinicRole()).isEqualTo("owner");
    }

    @Test
    void anAccountOutsideAClinicHasNoTenant() {
        UUID accountId = UUID.randomUUID();
        IdentityStore.AccountRow row =
                new IdentityStore.AccountRow(accountId, "919800000000", AccountType.ADMIN, "Ada", false, null, null);

        AccountPrincipal principal = directory(accountId).load(row);

        assertThat(principal.accountType()).isEqualTo(AccountType.ADMIN);
        assertThat(principal.clinicId()).isNull();
        assertThat(principal.clinicRole()).isNull();
    }

    private static AccountDirectory directory(UUID accountId) {
        IdentityStore accounts = mock(IdentityStore.class);
        when(accounts.subtypes(accountId)).thenReturn(Set.of());
        when(accounts.permissions(accountId)).thenReturn(Set.of());
        when(accounts.pinHash(accountId)).thenReturn(Optional.empty());
        return new AccountDirectory(accounts, mock(PharmacyStore.class));
    }
}
