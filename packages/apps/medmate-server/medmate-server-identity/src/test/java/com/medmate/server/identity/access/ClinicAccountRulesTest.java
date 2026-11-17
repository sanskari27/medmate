package com.medmate.server.identity.access;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.medmate.server.identity.config.MedmateIdentityProperties;
import com.medmate.server.identity.session.AccessTokens;
import com.medmate.server.identity.session.AccountCreator;
import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.identity.sms.SmsSender;
import com.medmate.server.identity.store.IdentityStore;
import com.medmate.server.identity.store.PharmacyStore;
import com.medmate.server.identity.web.AuthService;
import com.medmate.server.identity.web.SessionIssuer;
import com.medmate.server.shared.error.ApiProblem;
import com.nimbusds.jwt.SignedJWT;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

class ClinicAccountRulesTest {

    private static final UUID CLINIC_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final Instant NOW = Instant.parse("2026-11-17T00:00:00Z");
    private static final String SECRET = "test-jwt-secret-test-jwt-secret-32";

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

    @Test
    void clinicPinRulesMatchThePharmacyShape() {
        assertThat(PinRules.signIn(AccountType.CLINIC, false, true, null, null)).isTrue();
        assertThat(PinRules.signIn(AccountType.CLINIC, false, false, null, null))
                .isFalse();
        assertThat(PinRules.signIn(AccountType.CLINIC, true, true, null, null)).isFalse();
        assertThat(PinRules.setupRequired(AccountType.CLINIC, false, false, null, null))
                .isTrue();
        assertThat(PinRules.setupRequired(AccountType.CLINIC, false, true, null, null))
                .isFalse();
        assertThat(PinRules.setupRequired(AccountType.CLINIC, true, false, null, null))
                .isFalse();
        assertThat(PinRules.setupRequired(
                        AccountType.PHARMACY, false, false, PharmacyRole.OWNER, VerificationStatus.APPROVED))
                .isTrue();
        assertThat(PinRules.setupRequired(
                        AccountType.PHARMACY, false, false, PharmacyRole.STAFF, VerificationStatus.APPROVED))
                .isFalse();
        assertThat(PinRules.signIn(AccountType.PHARMACY, false, true, PharmacyRole.OWNER, VerificationStatus.APPROVED))
                .isTrue();
        assertThat(PinRules.signIn(AccountType.PHARMACY, true, true, PharmacyRole.STAFF, VerificationStatus.APPROVED))
                .isFalse();
    }

    @Test
    void aClinicAccountSignsInWithAPin() throws Exception {
        UUID accountId = UUID.randomUUID();
        IdentityStore.AccountRow row = new IdentityStore.AccountRow(
                accountId, "+919845012345", AccountType.CLINIC, "Dr. Ananya Rao", false, CLINIC_ID, "owner");
        IdentityStore accounts = mock(IdentityStore.class);
        when(accounts.findAccount("+919845012345", AccountType.CLINIC)).thenReturn(Optional.of(row));
        when(accounts.subtypes(accountId)).thenReturn(Set.of());
        when(accounts.permissions(accountId)).thenReturn(Set.of());
        when(accounts.pinHash(accountId)).thenReturn(Optional.of("encoded"));
        PasswordEncoder pins = mock(PasswordEncoder.class);
        when(pins.matches("1234", "encoded")).thenReturn(true);
        SessionIssuer sessions = new SessionIssuer(accounts, new AccessTokens(SECRET, 900), 900, 2592000);
        AuthService auth =
                authService(accounts, new AccountDirectory(accounts, mock(PharmacyStore.class)), sessions, pins);

        SessionIssuer.SessionResponse response = auth.pin("9845012345", "clinic", "1234");

        assertThat(response.account().accountType()).isEqualTo("clinic");
        assertThat(response.account().clinicId()).isEqualTo(CLINIC_ID);
        assertThat(response.account().clinicRole()).isEqualTo("owner");
        assertThat(SignedJWT.parse(response.accessToken())
                        .getJWTClaimsSet()
                        .getClaim("clinicId")
                        .toString())
                .isEqualTo(CLINIC_ID.toString());
        assertThat(SignedJWT.parse(response.accessToken()).getJWTClaimsSet().getClaim("clinicRole"))
                .isEqualTo("owner");
    }

    @Test
    void pinSetupIsRequiredUntilTheClinicAccountSetsAPin() {
        UUID accountId = UUID.randomUUID();
        SessionIssuer sessions =
                new SessionIssuer(mock(IdentityStore.class), new AccessTokens(SECRET, 900), 900, 2592000);

        assertThat(sessions.issue(principal(accountId, false), NOW).account().pinSetupRequired())
                .isTrue();
        assertThat(sessions.issue(principal(accountId, true), NOW).account().pinSetupRequired())
                .isFalse();
    }

    @Test
    void anAccountWithNoPinPathCannotUsePinSignIn() {
        IdentityStore accounts = mock(IdentityStore.class);
        AuthService auth = authService(
                accounts,
                new AccountDirectory(accounts, mock(PharmacyStore.class)),
                mock(SessionIssuer.class),
                mock(PasswordEncoder.class));

        assertThatThrownBy(() -> auth.pin("9876543210", "customer", "1234"))
                .isInstanceOfSatisfying(ApiProblem.class, problem -> {
                    assertThat(problem.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(problem.getMessage()).isEqualTo("PIN was not accepted");
                });
    }

    private static AuthService authService(
            IdentityStore accounts, AccountDirectory directory, SessionIssuer sessions, PasswordEncoder pins) {
        return new AuthService(
                accounts,
                directory,
                mock(AccountCreator.class),
                sessions,
                mock(SmsSender.class),
                pins,
                mock(MedmateIdentityProperties.class),
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private static AccountPrincipal principal(UUID accountId, boolean pinSet) {
        return new AccountPrincipal(
                accountId,
                "+919845012345",
                AccountType.CLINIC,
                "Dr. Ananya Rao",
                false,
                null,
                null,
                null,
                null,
                null,
                Set.of(),
                Set.of(),
                pinSet,
                null,
                CLINIC_ID,
                "owner");
    }

    private static AccountDirectory directory(UUID accountId) {
        IdentityStore accounts = mock(IdentityStore.class);
        when(accounts.subtypes(accountId)).thenReturn(Set.of());
        when(accounts.permissions(accountId)).thenReturn(Set.of());
        when(accounts.pinHash(accountId)).thenReturn(Optional.empty());
        return new AccountDirectory(accounts, mock(PharmacyStore.class));
    }
}
