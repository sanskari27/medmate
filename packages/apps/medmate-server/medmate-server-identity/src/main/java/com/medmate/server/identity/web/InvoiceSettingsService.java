package com.medmate.server.identity.web;

import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.identity.config.MedmateIdentityProperties;
import com.medmate.server.identity.documents.DocumentStore;
import com.medmate.server.identity.mail.MailSender;
import com.medmate.server.identity.pharmacy.PharmacyRules;
import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.identity.store.PharmacyStore;
import com.medmate.server.shared.error.ApiProblem;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class InvoiceSettingsService {

    public static final String READ = "invoice-settings:read";
    public static final String UPDATE = "invoice-settings:update";

    private static final Logger log = LoggerFactory.getLogger(InvoiceSettingsService.class);

    private final PharmacyStore pharmacies;
    private final DocumentStore documents;
    private final MailSender mail;
    private final AccountDirectory directory;
    private final MedmateIdentityProperties properties;
    private final java.time.Clock clock;

    public InvoiceSettingsService(
            PharmacyStore pharmacies,
            DocumentStore documents,
            MailSender mail,
            AccountDirectory directory,
            MedmateIdentityProperties properties,
            java.time.Clock clock) {
        this.pharmacies = pharmacies;
        this.documents = documents;
        this.mail = mail;
        this.directory = directory;
        this.properties = properties;
        this.clock = clock;
    }

    public InvoiceView read(AccountPrincipal actor) {
        require(actor, READ, "Invoice settings cannot be read");
        return view(pharmacy(actor));
    }

    @Transactional
    public InvoiceSaved update(AccountPrincipal actor, PharmacyRules.InvoiceInput input) {
        require(actor, UPDATE, "Invoice settings cannot be updated");
        UUID pharmacyId = pharmacy(actor);
        boolean signatureStored = pharmacies.storedSlots(pharmacyId).contains("signature");
        String problem = PharmacyRules.invoiceInvalid(input, signatureStored);
        if (problem != null) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", problem);
        }
        PharmacyStore.InvoiceRow current = pharmacies
                .invoiceSettings(pharmacyId)
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found"));
        boolean review = PharmacyRules.signatureReplaced(input);
        pharmacies.saveInvoiceSettings(pharmacyId, input, review ? clock.instant() : null);
        put(pharmacyId, "logo", input.logo());
        put(pharmacyId, "signature", input.signature());
        if (review) {
            pharmacies.updateStatus(pharmacyId, VerificationStatus.PENDING_COMPLIANCE, null, null);
            send(current.email(), current.name());
        }
        PharmacyApplicationService.VerificationResponse verification =
                PharmacyApplicationService.VerificationResponse.from(directory.load(actor.id()));
        InvoiceView saved = view(pharmacyId);
        return new InvoiceSaved(
                saved.template(),
                saved.accent(),
                saved.title(),
                saved.prefix(),
                saved.signatory(),
                saved.bankLine(),
                saved.showBank(),
                saved.terms(),
                saved.showLogo(),
                saved.showStamp(),
                saved.logo(),
                saved.signature(),
                verification.status(),
                verification.rejection(),
                verification.pinSetupRequired());
    }

    private InvoiceView view(UUID pharmacyId) {
        PharmacyStore.InvoiceRow row = pharmacies
                .invoiceSettings(pharmacyId)
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found"));
        return new InvoiceView(
                row.template(),
                row.accent(),
                row.title(),
                row.prefix(),
                row.signatory(),
                row.bankLine() == null ? "" : row.bankLine(),
                row.showBank(),
                row.terms() == null ? "" : row.terms(),
                row.showLogo(),
                row.showStamp(),
                file(pharmacyId, "logo"),
                file(pharmacyId, "signature"),
                new PharmacyHeader(
                        text(row.name()),
                        address(row.address(), row.city(), row.state(), row.pincode()),
                        text(row.phone()),
                        text(row.email()),
                        text(row.gstin()),
                        text(row.drugLicenceNo()),
                        text(row.pharmacistName())));
    }

    private static String address(String street, String city, String state, String pincode) {
        StringBuilder joined = new StringBuilder();
        append(joined, street);
        append(joined, city);
        append(joined, state);
        append(joined, pincode);
        return joined.toString();
    }

    private static void append(StringBuilder joined, String part) {
        if (part == null || part.isBlank()) {
            return;
        }
        if (!joined.isEmpty()) {
            joined.append(", ");
        }
        joined.append(part.trim());
    }

    private static String text(String value) {
        return value == null ? "" : value;
    }

    private InvoiceFile file(UUID pharmacyId, String slot) {
        return pharmacies
                .document(pharmacyId, slot)
                .map(row -> new InvoiceFile(row.contentType(), documents.url(row.objectKey())))
                .orElse(null);
    }

    private UUID pharmacy(AccountPrincipal actor) {
        if (actor.pharmacyId() == null) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        return actor.pharmacyId();
    }

    private void require(AccountPrincipal actor, String key, String detail) {
        if (!Access.pharmacy(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus(),
                actor.permissions(),
                key)) {
            throw new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
        }
    }

    private void put(UUID pharmacyId, String slot, PharmacyRules.Upload upload) {
        if (upload == null || upload.body() == null || upload.body().length == 0) {
            return;
        }
        pharmacies.document(pharmacyId, slot).ifPresent(existing -> {
            documents.delete(existing.objectKey());
            pharmacies.deleteDocument(pharmacyId, slot);
        });
        String key = properties.uploadPrefix() + "/pharmacy-documents/" + pharmacyId + "/" + slot;
        String contentType = PharmacyRules.media(upload.contentType());
        documents.put(key, contentType, upload.body());
        pharmacies.insertDocument(pharmacyId, slot, key, contentType);
    }

    private void send(String email, String name) {
        if (email == null || email.isBlank() || name == null || name.isBlank()) {
            return;
        }
        try {
            mail.send(
                    email.trim().toLowerCase(Locale.ROOT),
                    "We received your pharmacy application",
                    "We received the application for " + name.trim() + ". Compliance will review it.");
        } catch (RuntimeException exception) {
            log.warn("Application mail was not sent");
        }
    }

    public record InvoiceFile(String contentType, String url) {}

    public record InvoiceView(
            String template,
            String accent,
            String title,
            String prefix,
            String signatory,
            String bankLine,
            boolean showBank,
            String terms,
            boolean showLogo,
            boolean showStamp,
            InvoiceFile logo,
            InvoiceFile signature,
            PharmacyHeader pharmacy) {}

    public record PharmacyHeader(
            String name,
            String address,
            String phone,
            String email,
            String gstin,
            String drugLicenceNo,
            String pharmacistName) {}

    public record InvoiceSaved(
            String template,
            String accent,
            String title,
            String prefix,
            String signatory,
            String bankLine,
            boolean showBank,
            String terms,
            boolean showLogo,
            boolean showStamp,
            InvoiceFile logo,
            InvoiceFile signature,
            String status,
            SessionIssuer.RejectionResponse rejection,
            boolean pinSetupRequired) {}
}
