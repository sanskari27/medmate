package com.medmate.server.identity.web;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.BlockRules;
import com.medmate.server.identity.access.Verification;
import com.medmate.server.identity.documents.DocumentStore;
import com.medmate.server.identity.store.BlockStore;
import com.medmate.server.identity.store.IdentityStore;
import com.medmate.server.identity.store.PharmacyStore;
import com.medmate.server.shared.error.ApiProblem;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class OwnerDirectoryService {

    private final PharmacyStore pharmacies;
    private final BlockStore blocks;
    private final IdentityStore accounts;
    private final DocumentStore documents;
    private final Clock clock;

    public OwnerDirectoryService(
            PharmacyStore pharmacies, BlockStore blocks, IdentityStore accounts, DocumentStore documents, Clock clock) {
        this.pharmacies = pharmacies;
        this.blocks = blocks;
        this.accounts = accounts;
        this.documents = documents;
        this.clock = clock;
    }

    public List<OwnerSummary> list(AccountPrincipal actor) {
        requireReader(actor);
        return pharmacies.listOwners().stream()
                .map(row -> new OwnerSummary(
                        row.pharmacyId(),
                        row.name(),
                        row.phone(),
                        row.status().wire(),
                        BlockRules.State.of(row.ownerDisabled(), row.openRequest())
                                .wire()))
                .toList();
    }

    public OwnerDetail detail(AccountPrincipal actor, UUID pharmacyId) {
        requireReader(actor);
        return detail(pharmacyId);
    }

    @Transactional
    public OwnerDetail requestBlock(AccountPrincipal actor, UUID pharmacyId, String rawReason) {
        if (actor.accountType() == AccountType.ADMIN && !actor.disabled()) {
            throw forbidden("Platform admin decides a block directly.");
        }
        if (!BlockRules.canRequest(actor.accountType(), actor.disabled(), actor.subtypes())) {
            throw forbidden("A block request is not allowed");
        }
        String reason = BlockRules.reason(rawReason);
        if (reason == null) {
            throw bad("A reason is required.");
        }
        PharmacyStore.PharmacyRow pharmacy = requirePharmacy(pharmacyId);
        boolean open = blocks.openForPharmacy(pharmacyId).isPresent();
        refuse(BlockRules.request(accountsDisabled(pharmacy), open));
        try {
            blocks.insertOpen(UUID.randomUUID(), pharmacyId, actor.id(), reason, clock.instant());
        } catch (DuplicateKeyException exception) {
            throw conflict("A block request is already open.");
        }
        return detail(pharmacyId);
    }

    @Transactional
    public OwnerDetail decide(AccountPrincipal actor, UUID pharmacyId, UUID requestId, String rawDecision) {
        requireAdmin(actor);
        Verification.Decision decision = Verification.Decision.parse(rawDecision);
        if (decision == null) {
            throw bad("Decision is required");
        }
        requirePharmacy(pharmacyId);
        BlockStore.OpenRequest request = blocks.find(requestId)
                .filter(row -> row.pharmacyId().equals(pharmacyId))
                .orElseThrow(() -> notFound("Block request was not found"));
        if (!"open".equals(request.status())) {
            throw conflict("This block request is not open.");
        }
        Instant now = clock.instant();
        if (!blocks.decide(
                requestId, pharmacyId, decision.name().toLowerCase(java.util.Locale.ROOT), actor.id(), now)) {
            throw conflict("This block request is not open.");
        }
        if (decision == Verification.Decision.APPROVE) {
            accounts.setDisabled(requirePharmacy(pharmacyId).ownerAccountId(), true);
        }
        return detail(pharmacyId);
    }

    @Transactional
    public OwnerDetail block(AccountPrincipal actor, UUID pharmacyId) {
        requireAdmin(actor);
        PharmacyStore.PharmacyRow pharmacy = requirePharmacy(pharmacyId);
        boolean open = blocks.openForPharmacy(pharmacyId).isPresent();
        refuse(BlockRules.directBlock(accountsDisabled(pharmacy), open));
        accounts.setDisabled(pharmacy.ownerAccountId(), true);
        return detail(pharmacyId);
    }

    @Transactional
    public OwnerDetail unblock(AccountPrincipal actor, UUID pharmacyId) {
        requireAdmin(actor);
        PharmacyStore.PharmacyRow pharmacy = requirePharmacy(pharmacyId);
        refuse(BlockRules.unblock(accountsDisabled(pharmacy)));
        accounts.setDisabled(pharmacy.ownerAccountId(), false);
        return detail(pharmacyId);
    }

    private OwnerDetail detail(UUID pharmacyId) {
        PharmacyStore.ApplicationRow application =
                pharmacies.application(pharmacyId).orElseThrow(() -> notFound("Pharmacy was not found"));
        boolean disabled = pharmacies.ownerDisabled(pharmacyId);
        BlockStore.OpenRequest open = blocks.openForPharmacy(pharmacyId).orElse(null);
        ReviewService.ApplicationDetail fields = ReviewService.ApplicationDetail.from(application, documents);
        return OwnerDetail.from(
                fields,
                BlockRules.State.of(disabled, open != null).wire(),
                open == null ? null : new BlockRequestView(open.id(), open.reason(), open.requestedAt()));
    }

    private boolean accountsDisabled(PharmacyStore.PharmacyRow pharmacy) {
        return pharmacies.ownerDisabled(pharmacy.id());
    }

    private PharmacyStore.PharmacyRow requirePharmacy(UUID pharmacyId) {
        return pharmacies.findById(pharmacyId).orElseThrow(() -> notFound("Pharmacy was not found"));
    }

    private static void requireReader(AccountPrincipal actor) {
        if (!BlockRules.directoryReader(actor.accountType(), actor.disabled(), actor.subtypes())) {
            throw forbidden("Pharmacy owners are not available");
        }
    }

    private static void requireAdmin(AccountPrincipal actor) {
        if (!BlockRules.canDecide(actor.accountType(), actor.disabled())) {
            throw forbidden("Only platform admin can decide a block");
        }
    }

    private static void refuse(BlockRules.Outcome outcome) {
        switch (outcome) {
            case ALLOWED -> {
                return;
            }
            case ALREADY_BLOCKED -> throw conflict("This pharmacy is already blocked.");
            case REQUEST_OPEN -> throw conflict("A block request is already open.");
            case NOT_BLOCKED -> throw conflict("This pharmacy is not blocked.");
            case NOT_OPEN -> throw conflict("This block request is not open.");
        }
    }

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem forbidden(String detail) {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }

    private static ApiProblem notFound(String detail) {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", detail);
    }

    private static ApiProblem conflict(String detail) {
        return new ApiProblem(HttpStatus.CONFLICT, "Conflict", detail);
    }

    public record OwnerSummary(UUID pharmacyId, String name, String phone, String status, String blockState) {}

    public record BlockRequestView(UUID id, String reason, Instant requestedAt) {}

    public record OwnerDetail(
            UUID pharmacyId,
            String status,
            SessionIssuer.RejectionResponse rejection,
            String phone,
            String name,
            String tagline,
            String email,
            String address,
            String city,
            String state,
            String pincode,
            List<String> businessTypes,
            String industry,
            String registrationType,
            String pharmacyType,
            String gstin,
            String pan,
            String drugLicenceNo,
            String fssaiNo,
            String tradeLicenceNo,
            boolean enableTds,
            boolean enableTcs,
            String pharmacistName,
            String invoicePrefix,
            String terms,
            boolean acceptOnlineOrders,
            boolean selfOrderKiosk,
            boolean eInvoicing,
            boolean looseSelling,
            boolean lowStockAlerts,
            Instant submittedAt,
            List<ReviewService.DocumentItem> documents,
            String blockState,
            BlockRequestView request) {

        static OwnerDetail from(ReviewService.ApplicationDetail detail, String blockState, BlockRequestView request) {
            return new OwnerDetail(
                    detail.pharmacyId(),
                    detail.status(),
                    detail.rejection(),
                    detail.phone(),
                    detail.name(),
                    detail.tagline(),
                    detail.email(),
                    detail.address(),
                    detail.city(),
                    detail.state(),
                    detail.pincode(),
                    detail.businessTypes(),
                    detail.industry(),
                    detail.registrationType(),
                    detail.pharmacyType(),
                    detail.gstin(),
                    detail.pan(),
                    detail.drugLicenceNo(),
                    detail.fssaiNo(),
                    detail.tradeLicenceNo(),
                    detail.enableTds(),
                    detail.enableTcs(),
                    detail.pharmacistName(),
                    detail.invoicePrefix(),
                    detail.terms(),
                    detail.acceptOnlineOrders(),
                    detail.selfOrderKiosk(),
                    detail.eInvoicing(),
                    detail.looseSelling(),
                    detail.lowStockAlerts(),
                    detail.submittedAt(),
                    detail.documents(),
                    blockState,
                    request);
        }
    }
}
