package com.medmate.server.identity.web;

import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.Verification;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.identity.mail.MailSender;
import com.medmate.server.identity.store.PharmacyStore;
import com.medmate.server.shared.error.ApiProblem;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewService.class);

    private final PharmacyStore pharmacies;
    private final MailSender mail;
    private final Clock clock;

    public ReviewService(PharmacyStore pharmacies, MailSender mail, Clock clock) {
        this.pharmacies = pharmacies;
        this.mail = mail;
        this.clock = clock;
    }

    public List<PharmacyStore.Summary> list(AccountPrincipal actor, String rawStatus) {
        if (!Access.platform(actor.accountType(), actor.disabled(), actor.subtypes(), "compliance")) {
            throw forbidden("Compliance review is not allowed");
        }
        VerificationStatus status = VerificationStatus.parse(rawStatus);
        if (status != VerificationStatus.PENDING_COMPLIANCE && status != VerificationStatus.PENDING_ADMIN) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Status is required");
        }
        return pharmacies.list(status);
    }

    @Transactional
    public PharmacyApplicationService.VerificationResponse compliance(
            AccountPrincipal actor, UUID pharmacyId, String rawDecision, String comment) {
        if (!Access.platform(actor.accountType(), actor.disabled(), actor.subtypes(), "compliance")) {
            throw forbidden("Compliance review is not allowed");
        }
        return decide(actor, pharmacyId, "compliance", rawDecision, comment, true);
    }

    @Transactional
    public PharmacyApplicationService.VerificationResponse admin(
            AccountPrincipal actor, UUID pharmacyId, String rawDecision, String comment) {
        if (actor.accountType() != AccountType.ADMIN || actor.disabled()) {
            throw forbidden("Admin review is not allowed");
        }
        return decide(actor, pharmacyId, "admin", rawDecision, comment, false);
    }

    private PharmacyApplicationService.VerificationResponse decide(
            AccountPrincipal actor,
            UUID pharmacyId,
            String stage,
            String rawDecision,
            String comment,
            boolean compliance) {
        PharmacyStore.PharmacyRow pharmacy = pharmacies
                .findById(pharmacyId)
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found"));
        Verification.Decision decision = Verification.Decision.parse(rawDecision);
        if (decision == null) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Decision is required");
        }
        String storedComment = comment == null ? null : comment.trim();
        if (decision == Verification.Decision.REJECT && (storedComment == null || storedComment.isBlank())) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "A comment is required");
        }
        if (storedComment != null && storedComment.length() > 2000) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Comment is too long");
        }
        if (storedComment != null && storedComment.isBlank()) {
            storedComment = null;
        }
        var next = compliance
                ? Verification.compliance(pharmacy.status(), decision)
                : Verification.adminFinal(pharmacy.status(), decision);
        if (next.isEmpty()) {
            throw new ApiProblem(HttpStatus.CONFLICT, "Conflict", "The application is not waiting for this decision");
        }
        VerificationStatus status = next.get();
        String stageStored = status == VerificationStatus.REJECTED ? stage : null;
        String commentStored = status == VerificationStatus.REJECTED ? storedComment : null;
        pharmacies.updateStatus(pharmacy.id(), status, stageStored, commentStored);
        pharmacies.insertDecision(
                UUID.randomUUID(),
                pharmacy.id(),
                stage,
                decision.name().toLowerCase(java.util.Locale.ROOT),
                storedComment,
                actor.id(),
                clock.instant());
        if (status == VerificationStatus.APPROVED) {
            send(pharmacy, approved(pharmacy.name()));
        } else if (status == VerificationStatus.REJECTED) {
            send(pharmacy, rejected(pharmacy.name(), storedComment));
        }
        return new PharmacyApplicationService.VerificationResponse(
                pharmacy.id(), status.wire(), rejection(status, stage, storedComment), false);
    }

    private static SessionIssuer.RejectionResponse rejection(VerificationStatus status, String stage, String comment) {
        if (status != VerificationStatus.REJECTED) {
            return null;
        }
        return new SessionIssuer.RejectionResponse(stage, comment);
    }

    private void send(PharmacyStore.PharmacyRow pharmacy, Mail message) {
        if (pharmacy.email() == null || pharmacy.email().isBlank()) {
            return;
        }
        try {
            mail.send(pharmacy.email(), message.subject(), message.text());
        } catch (RuntimeException exception) {
            log.warn("Decision mail was not sent");
        }
    }

    private static Mail approved(String name) {
        return new Mail(
                "Your pharmacy is approved",
                name + " is approved. Sign in with the code sent to your phone, then set a PIN.");
    }

    private static Mail rejected(String name, String comment) {
        return new Mail(
                "Your pharmacy application was not approved",
                name + " was not approved. " + comment + " You can sign in and submit a new application.");
    }

    private static ApiProblem forbidden(String detail) {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }

    private record Mail(String subject, String text) {}

    public record ApplicationSummary(UUID pharmacyId, String name, String phone, String status, Instant submittedAt) {
        public static ApplicationSummary from(PharmacyStore.Summary summary) {
            return new ApplicationSummary(
                    summary.pharmacyId(),
                    summary.name(),
                    summary.phone(),
                    summary.status().wire(),
                    summary.submittedAt());
        }
    }
}
