package com.medmate.server.identity.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.config.MedmateIdentityProperties;
import com.medmate.server.identity.crypto.Secrets;
import com.medmate.server.identity.otp.OtpMachine;
import com.medmate.server.identity.session.AccessTokens;
import com.medmate.server.identity.session.AccountCreator;
import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.identity.sms.SmsSender;
import com.medmate.server.identity.store.IdentityStore;
import com.medmate.server.identity.store.PharmacyStore;
import com.medmate.server.shared.error.ApiExceptionHandler;
import com.nimbusds.jwt.SignedJWT;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ClinicSignInControllerTest {

    private static final UUID CLINIC_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ACCOUNT_ID = UUID.fromString("11111111-1111-4111-8111-111111111101");
    private static final String PHONE = "+919845012345";
    private static final Instant NOW = Instant.parse("2026-11-17T00:00:00Z");
    private static final String SECRET = "test-jwt-secret-test-jwt-secret-32";

    private final IdentityStore accounts = mock(IdentityStore.class);
    private final PasswordEncoder pins = mock(PasswordEncoder.class);
    private final AccessTokens tokens = new AccessTokens(SECRET, 900);
    private final AtomicReference<String> storedPin = new AtomicReference<>();
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new AuthController(auth()))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    private AuthService auth() {
        return new AuthService(
                accounts,
                new AccountDirectory(accounts, mock(PharmacyStore.class)),
                mock(AccountCreator.class),
                new SessionIssuer(accounts, tokens, 900, 2592000),
                mock(SmsSender.class),
                pins,
                mock(MedmateIdentityProperties.class),
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @BeforeEach
    void stubAccount() {
        IdentityStore.AccountRow row = new IdentityStore.AccountRow(
                ACCOUNT_ID, PHONE, AccountType.CLINIC, "Dr. Ananya Rao", false, CLINIC_ID, "owner");
        when(accounts.findAccount(PHONE, AccountType.CLINIC)).thenReturn(Optional.of(row));
        when(accounts.findAccount(ACCOUNT_ID)).thenReturn(Optional.of(row));
        when(accounts.subtypes(ACCOUNT_ID)).thenReturn(Set.of());
        when(accounts.permissions(ACCOUNT_ID)).thenReturn(Set.of());
        when(accounts.pinHash(ACCOUNT_ID)).thenAnswer(invocation -> Optional.ofNullable(storedPin.get()));
        doAnswer(invocation -> {
                    storedPin.set(invocation.getArgument(1));
                    return null;
                })
                .when(accounts)
                .savePin(eq(ACCOUNT_ID), anyString(), any());
        when(pins.encode("1234")).thenReturn("encoded");
        when(pins.matches("1234", "encoded")).thenReturn(true);
    }

    @Test
    void aClinicAccountSignsInWithAPin() throws Exception {
        storedPin.set("encoded");

        String body = mvc.perform(post("/auth/pin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"9845012345\",\"accountType\":\"clinic\",\"pin\":\"1234\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.account.accountType").value("clinic"))
                .andExpect(jsonPath("$.account.clinicId").value(CLINIC_ID.toString()))
                .andExpect(jsonPath("$.account.clinicRole").value("owner"))
                .andExpect(jsonPath("$.account.pinSetupRequired").value(false))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String accessToken =
                new ObjectMapper().readTree(body).get("accessToken").asText();
        assertThat(tokens.parse(accessToken, NOW)).isEqualTo(ACCOUNT_ID);
        assertThat(SignedJWT.parse(accessToken)
                        .getJWTClaimsSet()
                        .getClaim("clinicId")
                        .toString())
                .isEqualTo(CLINIC_ID.toString());
        assertThat(SignedJWT.parse(accessToken).getJWTClaimsSet().getClaim("clinicRole"))
                .isEqualTo("owner");
    }

    @Test
    void aClinicAccountSetsItsPinAndNoLongerNeedsSetup() throws Exception {
        storedPin.set(null);

        mvc.perform(post("/auth/pin/set")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pin\":\"1234\"}")
                        .principal(new AccountAuthentication(principal(false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pinSetupRequired").value(false));

        verify(accounts).savePin(eq(ACCOUNT_ID), eq("encoded"), any());
    }

    @Test
    void anAccountWithNoPinPathIsRejected() throws Exception {
        mvc.perform(post("/auth/pin")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"9876543210\",\"accountType\":\"customer\",\"pin\":\"1234\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("PIN was not accepted"));
    }

    @Test
    void anOtpSignInWithoutAPinAsksForPinSetup() throws Exception {
        storedPin.set(null);
        when(accounts.findOtp(PHONE, AccountType.CLINIC, com.medmate.server.identity.otp.OtpPurpose.LOGIN))
                .thenReturn(Optional.of(new IdentityStore.OtpRow(
                        new OtpMachine.State(Secrets.sha256("000000"), NOW.plusSeconds(300), 0))));

        mvc.perform(
                        post("/auth/otp/verify")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"phone\":\"9845012345\",\"accountType\":\"clinic\",\"purpose\":\"login\",\"code\":\"000000\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.account.pinSetupRequired").value(true));
    }

    @Test
    void aRefreshedClinicSessionKeepsItsTenant() throws Exception {
        storedPin.set("encoded");
        String refreshToken = "refresh-token";
        when(accounts.findRefresh(Secrets.sha256(refreshToken)))
                .thenReturn(Optional.of(new IdentityStore.RefreshRow(ACCOUNT_ID, NOW.plusSeconds(1000), false)));

        String body = mvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"refresh-token\"}"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String accessToken =
                new ObjectMapper().readTree(body).get("accessToken").asText();
        assertThat(SignedJWT.parse(accessToken)
                        .getJWTClaimsSet()
                        .getClaim("clinicId")
                        .toString())
                .isEqualTo(CLINIC_ID.toString());
        assertThat(SignedJWT.parse(accessToken).getJWTClaimsSet().getClaim("clinicRole"))
                .isEqualTo("owner");
    }

    private static AccountPrincipal principal(boolean pinSet) {
        return new AccountPrincipal(
                ACCOUNT_ID,
                PHONE,
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
}
