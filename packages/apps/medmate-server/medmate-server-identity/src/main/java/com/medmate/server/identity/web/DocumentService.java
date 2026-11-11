package com.medmate.server.identity.web;

import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.documents.DocumentStore;
import com.medmate.server.identity.store.PharmacyStore;
import com.medmate.server.shared.error.ApiProblem;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@Profile({"local", "prod", "identity-it"})
public class DocumentService {

    static final Set<String> SLOTS = Set.of(
            "logo", "gst", "pan", "drug-licence", "fssai", "trade-licence", "pharmacist-certificate", "signature");

    private final PharmacyStore pharmacies;
    private final DocumentStore documents;

    public DocumentService(PharmacyStore pharmacies, DocumentStore documents) {
        this.pharmacies = pharmacies;
        this.documents = documents;
    }

    public DocumentStore.Stored open(AccountPrincipal actor, UUID pharmacyId, String slot) {
        if (!SLOTS.contains(slot)) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Document is not recognised");
        }
        if (!canRead(actor, pharmacyId)) {
            throw new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", "Document is not available");
        }
        PharmacyStore.DocumentRow row = pharmacies
                .document(pharmacyId, slot)
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Document was not found"));
        return documents
                .get(row.objectKey())
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Document was not found"));
    }

    private static boolean canRead(AccountPrincipal actor, UUID pharmacyId) {
        if (actor.disabled()) {
            return false;
        }
        if (actor.accountType() == AccountType.ADMIN) {
            return true;
        }
        if (Access.platform(actor.accountType(), false, actor.subtypes(), "compliance")) {
            return true;
        }
        return actor.accountType() == AccountType.PHARMACY
                && actor.pharmacyRole() == PharmacyRole.OWNER
                && pharmacyId.equals(actor.pharmacyId());
    }
}
