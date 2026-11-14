package com.medmate.server.doctors.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.doctors.DoctorRules;
import com.medmate.server.doctors.store.DoctorStore;
import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.config.MedmateIdentityProperties;
import com.medmate.server.identity.documents.DocumentStore;
import com.medmate.server.identity.documents.S3DocumentStore;
import com.medmate.server.identity.store.PharmacyStore;
import com.medmate.server.shared.error.ApiProblem;
import java.time.Clock;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class DoctorService {

    private static final String HOSPITAL_ONLY = "Doctors are only available for a hospital";

    private final DoctorStore doctors;
    private final PharmacyStore pharmacies;
    private final DocumentStore documents;
    private final MedmateIdentityProperties properties;
    private final Clock clock;

    public DoctorService(
            DoctorStore doctors,
            PharmacyStore pharmacies,
            DocumentStore documents,
            MedmateIdentityProperties properties,
            Clock clock) {
        this.doctors = doctors;
        this.pharmacies = pharmacies;
        this.documents = documents;
        this.properties = properties;
        this.clock = clock;
    }

    public DoctorViews.ListResponse list(AccountPrincipal actor) {
        require(actor, DoctorRules.READ, "Doctors cannot be read");
        Map<UUID, List<DoctorStore.WindowRow>> windows = windows(actor.pharmacyId());
        Map<UUID, List<DoctorStore.DocumentRow>> docs = documents(actor.pharmacyId());
        List<DoctorViews.DoctorView> people = new ArrayList<>();
        for (DoctorStore.DoctorRow row : doctors.list(actor.pharmacyId())) {
            people.add(view(row, windows.getOrDefault(row.id(), List.of()), docs.getOrDefault(row.id(), List.of())));
        }
        return new DoctorViews.ListResponse(people);
    }

    public DoctorViews.OneResponse one(AccountPrincipal actor, UUID id) {
        require(actor, DoctorRules.READ, "Doctors cannot be read");
        return response(actor, id);
    }

    @Transactional
    public DoctorViews.OneResponse create(
            AccountPrincipal actor, JsonNode body, DoctorRules.Upload photo, List<DoctorRules.DocumentUpload> uploads) {
        require(actor, DoctorRules.CREATE, "Doctors cannot be created");
        DoctorRules.Prepared prepared = DoctorRules.prepareCreate(body);
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        String fileProblem = DoctorRules.files(photo, uploads);
        if (fileProblem != null) {
            throw bad(fileProblem);
        }
        if (!doctors.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        if (doctors.codeTaken(
                actor.pharmacyId(), DoctorRules.codeKey(prepared.values().code()), null)) {
            throw conflict();
        }
        UUID id = UUID.randomUUID();
        DoctorStore.Photo stored = writePhoto(actor.pharmacyId(), id, photo, null, false);
        doctors.insert(id, actor.pharmacyId(), prepared.values(), stored);
        doctors.replaceWindows(id, prepared.values().windows());
        writeDocuments(actor.pharmacyId(), id, uploads);
        return response(actor, id);
    }

    @Transactional
    public DoctorViews.OneResponse update(
            AccountPrincipal actor,
            UUID id,
            JsonNode body,
            DoctorRules.Upload photo,
            List<DoctorRules.DocumentUpload> uploads) {
        require(actor, DoctorRules.UPDATE, "Doctors cannot be updated");
        DoctorStore.DoctorRow current = doctors.find(actor.pharmacyId(), id).orElseThrow(DoctorService::missing);
        List<DoctorRules.Window> currentWindows = DoctorStore.toWindows(windowsFor(actor.pharmacyId(), id));
        DoctorRules.Prepared prepared = DoctorRules.prepareUpdate(body, current.values(currentWindows));
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        String fileProblem = DoctorRules.files(photo, uploads);
        if (fileProblem != null) {
            throw bad(fileProblem);
        }
        if (!doctors.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        if (doctors.codeTaken(
                actor.pharmacyId(), DoctorRules.codeKey(prepared.values().code()), id)) {
            throw conflict();
        }
        boolean removePhoto = removePhoto(body, photo);
        DoctorStore.Photo stored = writePhoto(actor.pharmacyId(), id, photo, current.photoKey(), removePhoto);
        if (stored == null) {
            stored = new DoctorStore.Photo(current.photoKey(), current.photoContentType(), current.photoFileName());
        }
        doctors.update(id, actor.pharmacyId(), prepared.values(), stored);
        doctors.replaceWindows(id, prepared.values().windows());
        for (DoctorRules.DocumentChange change : prepared.documentChanges()) {
            if (!doctors.updateDocumentStatus(id, change.id(), change.verificationStatus())) {
                throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Document was not found");
            }
        }
        writeDocuments(actor.pharmacyId(), id, uploads);
        return response(actor, id);
    }

    public DoctorViews.StoredFile openPhoto(AccountPrincipal actor, UUID id) {
        require(actor, DoctorRules.READ, "Doctors cannot be read");
        DoctorStore.DoctorRow row = doctors.find(actor.pharmacyId(), id).orElseThrow(DoctorService::missing);
        if (row.photoKey() == null) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Document was not found");
        }
        return open(row.photoKey());
    }

    public DoctorViews.StoredFile openDocument(AccountPrincipal actor, UUID id, UUID documentId) {
        require(actor, DoctorRules.READ, "Doctors cannot be read");
        if (doctors.find(actor.pharmacyId(), id).isEmpty()) {
            throw missing();
        }
        DoctorStore.DocumentRow row = doctors.document(actor.pharmacyId(), id, documentId)
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Document was not found"));
        return open(row.objectKey());
    }

    private void require(AccountPrincipal actor, String key, String detail) {
        if (!Access.pharmacyMember(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus())) {
            throw forbidden(detail);
        }
        PharmacyStore.PharmacyRow pharmacy = pharmacies
                .findById(actor.pharmacyId())
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found"));
        if (!"hospital".equals(pharmacy.pharmacyType())) {
            throw forbidden(HOSPITAL_ONLY);
        }
        if (!Access.pharmacy(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus(),
                actor.permissions(),
                key)) {
            throw forbidden(detail);
        }
    }

    private DoctorViews.OneResponse response(AccountPrincipal actor, UUID id) {
        DoctorStore.DoctorRow row = doctors.find(actor.pharmacyId(), id).orElseThrow(DoctorService::missing);
        return new DoctorViews.OneResponse(
                view(row, windowsFor(actor.pharmacyId(), id), documentsFor(actor.pharmacyId(), id)));
    }

    private List<DoctorStore.WindowRow> windowsFor(UUID pharmacyId, UUID doctorId) {
        return windows(pharmacyId).getOrDefault(doctorId, List.of());
    }

    private List<DoctorStore.DocumentRow> documentsFor(UUID pharmacyId, UUID doctorId) {
        return documents(pharmacyId).getOrDefault(doctorId, List.of());
    }

    private DoctorStore.Photo writePhoto(
            UUID pharmacyId, UUID doctorId, DoctorRules.Upload photo, String previousKey, boolean remove) {
        if (present(photo)) {
            String type = DoctorRules.media(photo.contentType());
            String objectKey = objectKey(pharmacyId, doctorId, "photo");
            documents.put(objectKey, type, photo.body());
            if (previousKey != null && !previousKey.equals(objectKey)) {
                documents.delete(previousKey);
            }
            return new DoctorStore.Photo(objectKey, type, fileName(photo.fileName(), "photo"));
        }
        if (remove && previousKey != null) {
            documents.delete(previousKey);
            return new DoctorStore.Photo(null, null, null);
        }
        return null;
    }

    private void writeDocuments(UUID pharmacyId, UUID doctorId, List<DoctorRules.DocumentUpload> uploads) {
        if (uploads == null) {
            return;
        }
        for (DoctorRules.DocumentUpload upload : uploads) {
            if (!present(upload.file())) {
                continue;
            }
            UUID id = UUID.randomUUID();
            String type = DoctorRules.media(upload.file().contentType());
            String status = DoctorRules.verification(upload.verificationStatus());
            String objectKey = objectKey(pharmacyId, doctorId, id.toString());
            documents.put(objectKey, type, upload.file().body());
            doctors.insertDocument(
                    id,
                    doctorId,
                    upload.documentType().trim(),
                    fileName(upload.file().fileName(), "document"),
                    type,
                    objectKey,
                    status,
                    clock.instant());
        }
    }

    private DoctorViews.StoredFile open(String objectKey) {
        DocumentStore.Stored stored = documents
                .get(objectKey)
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Document was not found"));
        return new DoctorViews.StoredFile(stored.contentType(), stored.body());
    }

    private DoctorViews.DoctorView view(
            DoctorStore.DoctorRow row, List<DoctorStore.WindowRow> windows, List<DoctorStore.DocumentRow> docs) {
        DoctorViews.FileLink photo = null;
        if (row.photoKey() != null) {
            photo = new DoctorViews.FileLink(
                    row.photoFileName(),
                    row.photoContentType(),
                    link(row.photoKey(), "/pharmacy/doctors/" + row.id() + "/photo"));
        }
        List<DoctorViews.WindowLink> windowLinks = new ArrayList<>();
        for (DoctorStore.WindowRow window : windows) {
            windowLinks.add(new DoctorViews.WindowLink(
                    window.type(),
                    DoctorStore.splitDays(window.days()),
                    window.start(),
                    window.end(),
                    DoctorViews.fee(window.fee())));
        }
        List<DoctorViews.DocumentLink> links = new ArrayList<>();
        for (DoctorStore.DocumentRow document : docs) {
            links.add(new DoctorViews.DocumentLink(
                    document.id(),
                    document.documentType(),
                    document.fileName(),
                    document.contentType(),
                    document.verificationStatus(),
                    link(document.objectKey(), "/pharmacy/doctors/" + row.id() + "/documents/" + document.id())));
        }
        return new DoctorViews.DoctorView(
                row.id(),
                row.code(),
                row.firstName(),
                row.lastName(),
                row.displayName(),
                row.gender(),
                row.status(),
                row.registrationNumber(),
                row.registrationCouncil(),
                row.registrationState(),
                row.qualification(),
                row.specialization(),
                row.subSpecialization(),
                row.yearsExperience(),
                row.primaryMobile(),
                row.alternateMobile(),
                row.email(),
                row.whatsapp(),
                row.relationshipStatus(),
                row.notes(),
                row.workplaceName(),
                row.workplaceType(),
                row.address(),
                row.city(),
                row.state(),
                row.pinCode(),
                row.workplacePhone(),
                photo,
                windowLinks,
                links);
    }

    private Map<UUID, List<DoctorStore.WindowRow>> windows(UUID pharmacyId) {
        Map<UUID, List<DoctorStore.WindowRow>> grouped = new HashMap<>();
        for (DoctorStore.WindowRow window : doctors.windows(pharmacyId)) {
            grouped.computeIfAbsent(window.doctorId(), key -> new ArrayList<>()).add(window);
        }
        return grouped;
    }

    private Map<UUID, List<DoctorStore.DocumentRow>> documents(UUID pharmacyId) {
        Map<UUID, List<DoctorStore.DocumentRow>> grouped = new HashMap<>();
        for (DoctorStore.DocumentRow document : doctors.documents(pharmacyId)) {
            grouped.computeIfAbsent(document.doctorId(), key -> new ArrayList<>())
                    .add(document);
        }
        return grouped;
    }

    private String link(String objectKey, String localPath) {
        if (documents instanceof S3DocumentStore) {
            return documents.url(objectKey);
        }
        return localPath;
    }

    private String objectKey(UUID pharmacyId, UUID doctorId, String name) {
        return properties.uploadPrefix() + "/doctor-documents/" + pharmacyId + "/" + doctorId + "/" + name;
    }

    private static boolean removePhoto(JsonNode body, DoctorRules.Upload photo) {
        if (present(photo)
                || body == null
                || !body.has("removePhoto")
                || body.get("removePhoto").isNull()) {
            return false;
        }
        return body.get("removePhoto").asBoolean();
    }

    private static boolean present(DoctorRules.Upload upload) {
        return upload != null && upload.body() != null && upload.body().length > 0;
    }

    private static String fileName(String name, String fallback) {
        if (name == null || name.isBlank()) {
            return fallback;
        }
        return name.trim();
    }

    private static ApiProblem missing() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Doctor was not found");
    }

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem forbidden(String detail) {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }

    private static ApiProblem conflict() {
        return new ApiProblem(HttpStatus.CONFLICT, "Conflict", "Doctor code is already in use");
    }
}
