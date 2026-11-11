package com.medmate.server.identity.web;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.BlockRules;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.PlatformAccounts;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.identity.config.MedmateIdentityProperties;
import com.medmate.server.identity.crypto.Secrets;
import com.medmate.server.identity.otp.OtpMachine;
import com.medmate.server.identity.otp.OtpPurpose;
import com.medmate.server.identity.phone.PhoneNumbers;
import com.medmate.server.identity.pin.Pins;
import com.medmate.server.identity.session.AccountCreator;
import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.identity.sms.SmsSender;
import com.medmate.server.identity.store.IdentityStore;
import com.medmate.server.shared.error.ApiProblem;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Profile({"local", "prod", "identity-it"})
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final IdentityStore accounts;
    private final AccountDirectory directory;
    private final AccountCreator creator;
    private final SessionIssuer sessions;
    private final SmsSender sms;
    private final PasswordEncoder pins;
    private final MedmateIdentityProperties properties;
    private final Clock clock;

    public AuthService(
            IdentityStore accounts,
            AccountDirectory directory,
            AccountCreator creator,
            SessionIssuer sessions,
            SmsSender sms,
            PasswordEncoder pins,
            MedmateIdentityProperties properties,
            Clock clock) {
        this.accounts = accounts;
        this.directory = directory;
        this.creator = creator;
        this.sessions = sessions;
        this.sms = sms;
        this.pins = pins;
        this.properties = properties;
        this.clock = clock;
    }

    public OtpSendResponse send(String rawPhone, String rawType, String rawPurpose) {
        String phone = phone(rawPhone);
        OtpPurpose purpose = purpose(rawPurpose);
        if (platformScope(rawType)) {
            IdentityStore.AccountRow existing = solePlatform(phone);
            AccountType type = existing == null ? null : existing.type();
            return sendFor(phone, purpose, type, existing);
        }
        AccountType type = type(rawType);
        return sendFor(phone, purpose, type, accounts.findAccount(phone, type).orElse(null));
    }

    public SessionIssuer.SessionResponse verify(String rawPhone, String rawType, String rawPurpose, String code) {
        String phone = phone(rawPhone);
        OtpPurpose purpose = purpose(rawPurpose);
        AccountType type = resolvedType(phone, rawType, purpose);
        if (code == null || code.isBlank()) {
            throw unauthorized("Code was not accepted");
        }
        IdentityStore.OtpRow challenge = accounts.findOtp(phone, type, purpose).orElse(null);
        if (challenge == null) {
            throw unauthorized("Code was not accepted");
        }
        OtpMachine.Verdict verdict = OtpMachine.judge(challenge.state(), Secrets.sha256(code.trim()), clock.instant());
        switch (verdict) {
            case TOO_MANY -> throw unauthorized("Request a new code");
            case EXPIRED -> throw unauthorized("Code has expired");
            case MISMATCH -> {
                accounts.incrementOtpAttempts(phone, type, purpose);
                throw unauthorized("Code was not accepted");
            }
            case OK -> accounts.deleteOtp(phone, type, purpose);
        }
        IdentityStore.AccountRow account = resolve(phone, type, purpose);
        AccountPrincipal principal = directory.load(account);
        if (restrictedStaff(principal)) {
            throw unauthorized("This pharmacy is restricted.");
        }
        if (principal.disabled()
                && !BlockRules.restrictedOwnerSession(
                        principal.accountType(), principal.pharmacyRole(), principal.disabled())) {
            throw unauthorized("Code was not accepted");
        }
        if (purpose == OtpPurpose.PIN_RESET && !pinResetAllowed(account)) {
            throw unauthorized("Code was not accepted");
        }
        return sessions.issue(principal, clock.instant());
    }

    public SessionIssuer.SessionResponse pin(String rawPhone, String rawType, String pin) {
        if (platformScope(rawType)) {
            throw unauthorized("PIN was not accepted");
        }
        if (!Pins.valid(pin)) {
            throw bad("PIN must be 4 digits");
        }
        String phone = phone(rawPhone);
        AccountType type = type(rawType);
        if (type != AccountType.PHARMACY) {
            throw unauthorized("PIN was not accepted");
        }
        IdentityStore.AccountRow account = accounts.findAccount(phone, type).orElse(null);
        if (account != null && restrictedStaff(directory.load(account))) {
            throw unauthorized("This pharmacy is restricted.");
        }
        if (!pinLogin(account)) {
            throw unauthorized("PIN was not accepted");
        }
        String hash = accounts.pinHash(account.id()).orElse("");
        if (!pins.matches(pin, hash)) {
            throw unauthorized("PIN was not accepted");
        }
        return sessions.issue(directory.load(account), clock.instant());
    }

    public SessionIssuer.AccountResponse setPin(AccountPrincipal principal, String pin) {
        if (!Pins.valid(pin)) {
            throw bad("PIN must be 4 digits");
        }
        if (principal.accountType() != AccountType.PHARMACY
                || principal.pharmacyRole() != PharmacyRole.OWNER
                || principal.verificationStatus() != VerificationStatus.APPROVED
                || principal.disabled()) {
            throw forbidden("PIN can be set after the pharmacy is approved");
        }
        accounts.savePin(principal.id(), pins.encode(pin), clock.instant());
        return SessionIssuer.AccountResponse.from(directory.load(principal.id()));
    }

    public SessionIssuer.SessionResponse refresh(String refreshToken) {
        IdentityStore.RefreshRow row = refreshRow(refreshToken);
        accounts.revokeRefresh(Secrets.sha256(refreshToken));
        AccountPrincipal principal = directory.load(row.accountId());
        if (principal == null) {
            throw unauthorized("Session was not accepted");
        }
        if (restrictedStaff(principal)) {
            throw unauthorized("This pharmacy is restricted.");
        }
        if (principal.disabled()
                && !BlockRules.restrictedOwnerSession(
                        principal.accountType(), principal.pharmacyRole(), principal.disabled())) {
            throw unauthorized("Session was not accepted");
        }
        return sessions.issue(principal, clock.instant());
    }

    public void signOut(String refreshToken) {
        refreshRow(refreshToken);
        accounts.revokeRefresh(Secrets.sha256(refreshToken));
    }

    public BootstrapResponse bootstrap(String presented, String rawPhone) {
        String expected = properties.adminBootstrapToken() == null ? "" : properties.adminBootstrapToken();
        String given = presented == null ? "" : presented;
        if (expected.isBlank() || !Secrets.equal(expected, given)) {
            throw unauthorized("Sign in is required");
        }
        String phone = phone(rawPhone);
        IdentityStore.AccountRow existing =
                accounts.findAccount(phone, AccountType.ADMIN).orElse(null);
        if (existing != null) {
            return new BootstrapResponse(existing.id(), false);
        }
        if (accounts.findAccount(phone, AccountType.STAFF).isPresent()) {
            throw conflict("A staff account already exists for this phone");
        }
        try {
            IdentityStore.AccountRow created = creator.create(phone, AccountType.ADMIN, null, clock.instant());
            return new BootstrapResponse(created.id(), true);
        } catch (DuplicateKeyException exception) {
            IdentityStore.AccountRow winner =
                    accounts.findAccount(phone, AccountType.ADMIN).orElse(null);
            if (winner != null) {
                return new BootstrapResponse(winner.id(), false);
            }
            throw conflict("A staff account already exists for this phone");
        }
    }

    private OtpSendResponse sendFor(
            String phone, OtpPurpose purpose, AccountType type, IdentityStore.AccountRow existing) {
        if (purpose == OtpPurpose.SIGNUP && type != AccountType.PHARMACY) {
            throw bad("Signup is only for a pharmacy owner");
        }
        if (purpose == OtpPurpose.PIN_RESET && type != AccountType.PHARMACY) {
            throw bad("PIN reset is only for a pharmacy owner");
        }
        if (purpose == OtpPurpose.SIGNUP && existing != null) {
            throw conflict("A pharmacy account already exists for this phone");
        }
        if (purpose == OtpPurpose.LOGIN && pinLogin(existing)) {
            return new OtpSendResponse("pin");
        }
        if (purpose == OtpPurpose.PIN_RESET && !pinResetAllowed(existing)) {
            throw bad("PIN reset is not available");
        }
        if (!shouldDeliver(purpose, type, existing)) {
            return new OtpSendResponse("otp");
        }
        String code = Secrets.otpCode();
        Instant now = clock.instant();
        accounts.upsertOtp(phone, type, purpose, OtpMachine.issue(Secrets.sha256(code), now));
        try {
            sms.send(phone, code);
        } catch (RuntimeException exception) {
            accounts.deleteOtp(phone, type, purpose);
            log.warn("OTP delivery failed for {}", phone);
            throw new ApiProblem(HttpStatus.SERVICE_UNAVAILABLE, "OTP unavailable", "OTP could not be sent");
        }
        return new OtpSendResponse("otp");
    }

    private AccountType resolvedType(String phone, String rawType, OtpPurpose purpose) {
        if (!platformScope(rawType)) {
            return type(rawType);
        }
        if (purpose == OtpPurpose.SIGNUP) {
            throw bad("Signup is only for a pharmacy owner");
        }
        if (purpose == OtpPurpose.PIN_RESET) {
            throw bad("PIN reset is only for a pharmacy owner");
        }
        IdentityStore.AccountRow existing = solePlatform(phone);
        if (existing == null) {
            throw unauthorized("Code was not accepted");
        }
        return existing.type();
    }

    private IdentityStore.AccountRow solePlatform(String phone) {
        List<IdentityStore.AccountRow> rows = accounts.findPlatformAccounts(phone);
        Optional<AccountType> chosen = PlatformAccounts.sole(
                rows.stream().map(IdentityStore.AccountRow::type).toList());
        if (chosen.isEmpty()) {
            return null;
        }
        for (IdentityStore.AccountRow row : rows) {
            if (row.type() == chosen.get()) {
                return row;
            }
        }
        return null;
    }

    private static boolean platformScope(String raw) {
        return raw != null && "platform".equals(raw.trim().toLowerCase(Locale.ROOT));
    }

    private IdentityStore.AccountRow resolve(String phone, AccountType type, OtpPurpose purpose) {
        IdentityStore.AccountRow existing = accounts.findAccount(phone, type).orElse(null);
        if (purpose == OtpPurpose.SIGNUP) {
            if (existing != null) {
                throw conflict("A pharmacy account already exists for this phone");
            }
            try {
                return creator.createOwner(phone, clock.instant());
            } catch (DuplicateKeyException exception) {
                throw conflict("A pharmacy account already exists for this phone");
            }
        }
        if (existing != null) {
            return existing;
        }
        if (purpose == OtpPurpose.LOGIN && (type == AccountType.CUSTOMER || type == AccountType.RIDER)) {
            try {
                return creator.create(phone, type, null, clock.instant());
            } catch (DuplicateKeyException exception) {
                return accounts.findAccount(phone, type).orElseThrow();
            }
        }
        throw unauthorized("Code was not accepted");
    }

    private boolean pinLogin(IdentityStore.AccountRow account) {
        if (account == null || account.type() != AccountType.PHARMACY) {
            return false;
        }
        AccountPrincipal principal = directory.load(account);
        if (principal.disabled()
                && !BlockRules.restrictedOwnerSession(
                        principal.accountType(), principal.pharmacyRole(), principal.disabled())) {
            return false;
        }
        return principal.pharmacyRole() == PharmacyRole.OWNER
                && principal.verificationStatus() == VerificationStatus.APPROVED
                && principal.pinSet();
    }

    private boolean pinResetAllowed(IdentityStore.AccountRow account) {
        return account != null && !account.disabled() && pinLogin(account);
    }

    private boolean restrictedStaff(AccountPrincipal principal) {
        return principal != null
                && BlockRules.staffOfRestrictedPharmacy(
                        principal.accountType(), principal.pharmacyRole(), directory.ownerAccountDisabled(principal));
    }

    private boolean shouldDeliver(OtpPurpose purpose, AccountType type, IdentityStore.AccountRow existing) {
        if (purpose == OtpPurpose.SIGNUP || purpose == OtpPurpose.PIN_RESET) {
            return true;
        }
        if (type == AccountType.CUSTOMER || type == AccountType.RIDER) {
            return true;
        }
        if (existing == null) {
            return false;
        }
        if (!existing.disabled()) {
            return true;
        }
        AccountPrincipal principal = directory.load(existing);
        return BlockRules.restrictedOwnerSession(
                principal.accountType(), principal.pharmacyRole(), principal.disabled());
    }

    private IdentityStore.RefreshRow refreshRow(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw unauthorized("Session was not accepted");
        }
        IdentityStore.RefreshRow row =
                accounts.findRefresh(Secrets.sha256(refreshToken)).orElse(null);
        if (row == null || row.revoked() || !clock.instant().isBefore(row.expiresAt())) {
            throw unauthorized("Session was not accepted");
        }
        return row;
    }

    private static String phone(String raw) {
        String phone = PhoneNumbers.normalize(raw);
        if (phone == null) {
            throw bad("Enter an Indian mobile number");
        }
        return phone;
    }

    private static AccountType type(String raw) {
        AccountType type = AccountType.parse(raw);
        if (type == null) {
            throw bad("Account type is required");
        }
        return type;
    }

    private static OtpPurpose purpose(String raw) {
        OtpPurpose purpose = OtpPurpose.parse(raw);
        if (purpose == null) {
            throw bad("Purpose is required");
        }
        return purpose;
    }

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem unauthorized(String detail) {
        return new ApiProblem(HttpStatus.UNAUTHORIZED, "Unauthorized", detail);
    }

    private static ApiProblem forbidden(String detail) {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }

    private static ApiProblem conflict(String detail) {
        return new ApiProblem(HttpStatus.CONFLICT, "Conflict", detail);
    }

    public record OtpSendResponse(String mode) {}

    public record BootstrapResponse(UUID accountId, boolean created) {}
}
