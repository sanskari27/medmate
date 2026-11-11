package com.medmate.server.identity.web;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.identity.crypto.Secrets;
import com.medmate.server.identity.session.AccessTokens;
import com.medmate.server.identity.store.IdentityStore;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class SessionIssuer {

    private final IdentityStore accounts;
    private final AccessTokens tokens;
    private final long accessSeconds;
    private final long refreshSeconds;

    public SessionIssuer(
            IdentityStore accounts,
            AccessTokens tokens,
            @Value("${medmate.jwt.access-seconds:900}") long accessSeconds,
            @Value("${medmate.jwt.refresh-seconds:2592000}") long refreshSeconds) {
        this.accounts = accounts;
        this.tokens = tokens;
        this.accessSeconds = accessSeconds;
        this.refreshSeconds = refreshSeconds;
    }

    @Transactional
    public SessionResponse issue(AccountPrincipal principal, Instant now) {
        String refresh = Secrets.randomToken();
        accounts.insertRefresh(Secrets.sha256(refresh), principal.id(), now.plusSeconds(refreshSeconds));
        return new SessionResponse(
                tokens.issue(principal.id(), now), refresh, accessSeconds, AccountResponse.from(principal));
    }

    public record SessionResponse(String accessToken, String refreshToken, long expiresIn, AccountResponse account) {}

    public record RejectionResponse(String stage, String comment) {}

    public record AccountResponse(
            UUID id,
            String accountType,
            String phone,
            String displayName,
            UUID pharmacyId,
            String pharmacyRole,
            String verificationStatus,
            RejectionResponse rejection,
            List<String> subtypes,
            List<String> permissions,
            boolean pinSetupRequired,
            boolean disabled) {

        static AccountResponse from(AccountPrincipal principal) {
            RejectionResponse rejection = null;
            if (principal.verificationStatus() == VerificationStatus.REJECTED && principal.rejectionComment() != null) {
                rejection = new RejectionResponse(principal.rejectionStage(), principal.rejectionComment());
            }
            boolean pinSetup = principal.accountType() == AccountType.PHARMACY
                    && principal.pharmacyRole() == PharmacyRole.OWNER
                    && principal.verificationStatus() == VerificationStatus.APPROVED
                    && !principal.pinSet();
            return new AccountResponse(
                    principal.id(),
                    principal.accountType().wire(),
                    principal.phone(),
                    principal.displayName(),
                    principal.pharmacyId(),
                    principal.pharmacyRole() == null
                            ? null
                            : principal.pharmacyRole().wire(),
                    principal.verificationStatus() == null
                            ? null
                            : principal.verificationStatus().wire(),
                    rejection,
                    principal.subtypes().stream().map(subtype -> subtype.wire()).toList(),
                    principal.permissions().stream().toList(),
                    pinSetup,
                    principal.disabled());
        }
    }
}
