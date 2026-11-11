package com.medmate.server.identity.web;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.Verification;
import com.medmate.server.identity.config.MedmateIdentityProperties;
import com.medmate.server.identity.documents.DocumentStore;
import com.medmate.server.identity.mail.MailSender;
import com.medmate.server.identity.pharmacy.PharmacyRules;
import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.identity.store.IdentityStore;
import com.medmate.server.identity.store.PharmacyStore;
import com.medmate.server.shared.error.ApiProblem;
import java.time.Clock;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class PharmacyApplicationService {

    private static final Logger log = LoggerFactory.getLogger(PharmacyApplicationService.class);

    private final PharmacyStore pharmacies;
    private final IdentityStore accounts;
    private final AccountDirectory directory;
    private final DocumentStore documents;
    private final MailSender mail;
    private final MedmateIdentityProperties properties;
    private final Clock clock;

    public PharmacyApplicationService(
            PharmacyStore pharmacies,
            IdentityStore accounts,
            AccountDirectory directory,
            DocumentStore documents,
            MailSender mail,
            MedmateIdentityProperties properties,
            Clock clock) {
        this.pharmacies = pharmacies;
        this.accounts = accounts;
        this.directory = directory;
        this.documents = documents;
        this.mail = mail;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional
    public VerificationResponse submit(AccountPrincipal actor, PharmacyRules.ApplicationInput input) {
        if (actor.accountType() != AccountType.PHARMACY || actor.pharmacyRole() != PharmacyRole.OWNER) {
            throw new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", "Only the pharmacy owner can submit");
        }
        PharmacyStore.PharmacyRow pharmacy = pharmacies
                .findById(actor.pharmacyId())
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found"));
        if (Verification.submit(pharmacy.status()).isEmpty()) {
            throw new ApiProblem(HttpStatus.CONFLICT, "Conflict", "The application is already under review");
        }
        String problem = PharmacyRules.invalid(input, actor.phone());
        if (problem != null) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", problem);
        }
        pharmacies.saveSubmission(pharmacy.id(), input, clock.instant());
        replaceDocuments(pharmacy.id(), input);
        pharmacies.updateStatus(
                pharmacy.id(), Verification.submit(pharmacy.status()).orElseThrow(), null, null);
        accounts.updateDisplayName(actor.id(), input.name().trim());
        send(input.email(), received(input.name().trim()));
        return verification(actor.id());
    }

    public VerificationResponse verification(AccountPrincipal actor) {
        if (actor.accountType() != AccountType.PHARMACY || actor.pharmacyId() == null) {
            throw new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", "Verification is for a pharmacy account");
        }
        return verification(actor.id());
    }

    private VerificationResponse verification(UUID accountId) {
        return VerificationResponse.from(directory.load(accountId));
    }

    private void replaceDocuments(UUID pharmacyId, PharmacyRules.ApplicationInput input) {
        Set<String> previous = new LinkedHashSet<>(pharmacies.documentKeys(pharmacyId));
        pharmacies.deleteDocuments(pharmacyId);
        Set<String> next = new LinkedHashSet<>();
        put(pharmacyId, "logo", input.logo(), next);
        put(pharmacyId, "gst", input.gst(), next);
        put(pharmacyId, "pan", input.panCard(), next);
        put(pharmacyId, "drug-licence", input.drugLicence(), next);
        put(pharmacyId, "fssai", input.fssai(), next);
        put(pharmacyId, "trade-licence", input.tradeLicence(), next);
        put(pharmacyId, "pharmacist-certificate", input.pharmacistCertificate(), next);
        put(pharmacyId, "signature", input.signature(), next);
        for (String old : previous) {
            if (!next.contains(old)) {
                documents.delete(old);
            }
        }
    }

    private void put(UUID pharmacyId, String slot, PharmacyRules.Upload upload, Set<String> keys) {
        if (upload == null || upload.body() == null || upload.body().length == 0) {
            return;
        }
        String key = properties.uploadPrefix() + "/pharmacy-documents/" + pharmacyId + "/" + slot;
        String contentType = PharmacyRules.media(upload.contentType());
        documents.put(key, contentType, upload.body());
        pharmacies.insertDocument(pharmacyId, slot, key, contentType);
        keys.add(key);
    }

    private void send(String email, Mail mailMessage) {
        try {
            mail.send(email.trim().toLowerCase(java.util.Locale.ROOT), mailMessage.subject(), mailMessage.text());
        } catch (RuntimeException exception) {
            log.warn("Application mail was not sent");
        }
    }

    private static Mail received(String name) {
        return new Mail(
                "We received your pharmacy application",
                "We received the application for " + name.trim() + ". Compliance will review it.");
    }

    private record Mail(String subject, String text) {}

    public record VerificationResponse(
            UUID pharmacyId, String status, SessionIssuer.RejectionResponse rejection, boolean pinSetupRequired) {

        static VerificationResponse from(AccountPrincipal principal) {
            SessionIssuer.AccountResponse account = SessionIssuer.AccountResponse.from(principal);
            return new VerificationResponse(
                    account.pharmacyId(),
                    account.verificationStatus(),
                    account.rejection(),
                    account.pinSetupRequired());
        }
    }
}
