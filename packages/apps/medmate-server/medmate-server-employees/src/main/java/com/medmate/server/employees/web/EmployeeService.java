package com.medmate.server.employees.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.employees.EmployeeRules;
import com.medmate.server.employees.store.EmployeeStore;
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
public class EmployeeService {

    private final EmployeeStore employees;
    private final PharmacyStore pharmacies;
    private final DocumentStore documents;
    private final MedmateIdentityProperties properties;
    private final Clock clock;

    public EmployeeService(
            EmployeeStore employees,
            PharmacyStore pharmacies,
            DocumentStore documents,
            MedmateIdentityProperties properties,
            Clock clock) {
        this.employees = employees;
        this.pharmacies = pharmacies;
        this.documents = documents;
        this.properties = properties;
        this.clock = clock;
    }

    public EmployeeViews.ListResponse list(AccountPrincipal actor) {
        require(actor, EmployeeRules.READ, "Employees cannot be read");
        Map<String, List<EmployeeStore.DocumentRow>> byCode = grouped(actor.pharmacyId());
        List<EmployeeViews.EmployeeView> people = new ArrayList<>();
        for (EmployeeStore.EmployeeRow row : employees.list(actor.pharmacyId())) {
            people.add(view(row, byCode.getOrDefault(row.code(), List.of())));
        }
        return new EmployeeViews.ListResponse(workplace(actor.pharmacyId()), people);
    }

    public EmployeeViews.OneResponse one(AccountPrincipal actor, String code) {
        require(actor, EmployeeRules.READ, "Employees cannot be read");
        return response(actor, code);
    }

    @Transactional
    public EmployeeViews.OneResponse create(
            AccountPrincipal actor,
            JsonNode body,
            EmployeeRules.Upload photo,
            List<EmployeeRules.DocumentUpload> uploads) {
        require(actor, EmployeeRules.CREATE, "Employees cannot be created");
        EmployeeRules.Prepared prepared = EmployeeRules.prepareCreate(body);
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        String fileProblem = EmployeeRules.files(photo, uploads);
        if (fileProblem != null) {
            throw bad(fileProblem);
        }
        if (prepared.setsInactive() && !allowed(actor, EmployeeRules.DELETE)) {
            throw forbidden("Employees cannot be set inactive");
        }
        if (!employees.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        String code = EmployeeRules.nextCode(employees.codes(actor.pharmacyId()));
        EmployeeStore.Photo stored = writePhoto(actor.pharmacyId(), code, photo, null, false);
        employees.insert(actor.pharmacyId(), code, prepared.values(), stored);
        writeDocuments(actor.pharmacyId(), code, uploads);
        return response(actor, code);
    }

    @Transactional
    public EmployeeViews.OneResponse update(
            AccountPrincipal actor,
            String code,
            JsonNode body,
            EmployeeRules.Upload photo,
            List<EmployeeRules.DocumentUpload> uploads) {
        if (!allowed(actor, EmployeeRules.READ)
                && !allowed(actor, EmployeeRules.CREATE)
                && !allowed(actor, EmployeeRules.UPDATE)
                && !allowed(actor, EmployeeRules.DELETE)) {
            throw forbidden("Employees cannot be updated");
        }
        EmployeeStore.EmployeeRow current =
                employees.find(actor.pharmacyId(), code).orElseThrow(EmployeeService::missing);
        EmployeeRules.Prepared prepared = EmployeeRules.prepareUpdate(body, current.values());
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        String fileProblem = EmployeeRules.files(photo, uploads);
        if (fileProblem != null) {
            throw bad(fileProblem);
        }
        boolean removePhoto = removePhoto(body, photo);
        boolean hasFiles = present(photo) || (uploads != null && !uploads.isEmpty()) || removePhoto;
        if ((prepared.needsUpdate() || hasFiles) && !allowed(actor, EmployeeRules.UPDATE)) {
            throw forbidden("Employees cannot be updated");
        }
        if (prepared.setsInactive() && !allowed(actor, EmployeeRules.DELETE)) {
            throw forbidden("Employees cannot be set inactive");
        }
        EmployeeStore.Photo stored = writePhoto(actor.pharmacyId(), code, photo, current.photoKey(), removePhoto);
        if (stored == null) {
            stored = new EmployeeStore.Photo(current.photoKey(), current.photoContentType(), current.photoFileName());
        }
        employees.update(actor.pharmacyId(), code, prepared.values(), stored);
        writeDocuments(actor.pharmacyId(), code, uploads);
        return response(actor, code);
    }

    public EmployeeViews.StoredFile openPhoto(AccountPrincipal actor, String code) {
        require(actor, EmployeeRules.READ, "Employees cannot be read");
        EmployeeStore.EmployeeRow row = employees.find(actor.pharmacyId(), code).orElseThrow(EmployeeService::missing);
        if (row.photoKey() == null) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Document was not found");
        }
        return open(row.photoKey());
    }

    public EmployeeViews.StoredFile openDocument(AccountPrincipal actor, String code, UUID documentId) {
        require(actor, EmployeeRules.READ, "Employees cannot be read");
        if (employees.find(actor.pharmacyId(), code).isEmpty()) {
            throw missing();
        }
        EmployeeStore.DocumentRow row = employees
                .document(actor.pharmacyId(), code, documentId)
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Document was not found"));
        return open(row.objectKey());
    }

    private EmployeeViews.OneResponse response(AccountPrincipal actor, String code) {
        EmployeeStore.EmployeeRow row = employees.find(actor.pharmacyId(), code).orElseThrow(EmployeeService::missing);
        List<EmployeeStore.DocumentRow> docs = employees.documents(actor.pharmacyId()).stream()
                .filter(document -> document.code().equals(code))
                .toList();
        return new EmployeeViews.OneResponse(workplace(actor.pharmacyId()), view(row, docs));
    }

    private EmployeeStore.Photo writePhoto(
            UUID pharmacyId, String code, EmployeeRules.Upload photo, String previousKey, boolean remove) {
        if (present(photo)) {
            String type = EmployeeRules.media(photo.contentType());
            String objectKey = objectKey(pharmacyId, code, "photo");
            documents.put(objectKey, type, photo.body());
            if (previousKey != null && !previousKey.equals(objectKey)) {
                documents.delete(previousKey);
            }
            return new EmployeeStore.Photo(objectKey, type, fileName(photo.fileName(), "photo"));
        }
        if (remove && previousKey != null) {
            documents.delete(previousKey);
            return new EmployeeStore.Photo(null, null, null);
        }
        return null;
    }

    private void writeDocuments(UUID pharmacyId, String code, List<EmployeeRules.DocumentUpload> uploads) {
        if (uploads == null) {
            return;
        }
        for (EmployeeRules.DocumentUpload upload : uploads) {
            if (!present(upload.file())) {
                continue;
            }
            UUID id = UUID.randomUUID();
            String type = EmployeeRules.media(upload.file().contentType());
            String objectKey = objectKey(pharmacyId, code, id.toString());
            documents.put(objectKey, type, upload.file().body());
            employees.insertDocument(
                    id,
                    pharmacyId,
                    code,
                    upload.label(),
                    fileName(upload.file().fileName(), "document"),
                    type,
                    objectKey,
                    clock.instant());
        }
    }

    private EmployeeViews.StoredFile open(String objectKey) {
        DocumentStore.Stored stored = documents
                .get(objectKey)
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Document was not found"));
        return new EmployeeViews.StoredFile(stored.contentType(), stored.body());
    }

    private EmployeeViews.Workplace workplace(UUID pharmacyId) {
        return pharmacies
                .application(pharmacyId)
                .map(row -> new EmployeeViews.Workplace(
                        text(row.name()),
                        text(row.tagline()),
                        text(row.address()),
                        text(row.city()),
                        text(row.state()),
                        text(row.phone()),
                        logoUrl(pharmacyId, row.documents())))
                .orElse(new EmployeeViews.Workplace("", "", "", "", "", "", null));
    }

    private String logoUrl(UUID pharmacyId, List<PharmacyStore.StoredDocument> stored) {
        if (stored == null) {
            return null;
        }
        for (PharmacyStore.StoredDocument document : stored) {
            if ("logo".equals(document.slot())) {
                if (documents instanceof S3DocumentStore) {
                    return documents.url(document.objectKey());
                }
                return "/pharmacies/" + pharmacyId + "/documents/logo";
            }
        }
        return null;
    }

    private EmployeeViews.EmployeeView view(EmployeeStore.EmployeeRow row, List<EmployeeStore.DocumentRow> docs) {
        EmployeeViews.FileLink photo = null;
        if (row.photoKey() != null) {
            photo = new EmployeeViews.FileLink(
                    row.photoFileName(),
                    row.photoContentType(),
                    link(row.photoKey(), "/pharmacy/employees/" + row.code() + "/photo"));
        }
        List<EmployeeViews.DocumentLink> links = new ArrayList<>();
        for (EmployeeStore.DocumentRow document : docs) {
            links.add(new EmployeeViews.DocumentLink(
                    document.id(),
                    document.label(),
                    document.fileName(),
                    document.contentType(),
                    link(document.objectKey(), "/pharmacy/employees/" + row.code() + "/documents/" + document.id())));
        }
        EmployeeRules.Values values = row.values();
        return new EmployeeViews.EmployeeView(
                row.code(),
                values.name(),
                values.position(),
                values.department(),
                values.phone(),
                values.email(),
                values.address(),
                values.dob(),
                values.joinedOn(),
                values.employment(),
                values.salary(),
                values.status(),
                values.pan(),
                values.aadhaar(),
                values.bankName(),
                values.accountName(),
                values.accountNumber(),
                values.ifsc(),
                values.upi(),
                values.emergencyName(),
                values.emergencyPhone(),
                values.note(),
                values.bloodGroup(),
                photo,
                links);
    }

    private Map<String, List<EmployeeStore.DocumentRow>> grouped(UUID pharmacyId) {
        Map<String, List<EmployeeStore.DocumentRow>> byCode = new HashMap<>();
        for (EmployeeStore.DocumentRow document : employees.documents(pharmacyId)) {
            byCode.computeIfAbsent(document.code(), key -> new ArrayList<>()).add(document);
        }
        return byCode;
    }

    private String link(String objectKey, String localPath) {
        if (documents instanceof S3DocumentStore) {
            return documents.url(objectKey);
        }
        return localPath;
    }

    private String objectKey(UUID pharmacyId, String code, String name) {
        return properties.uploadPrefix() + "/employee-documents/" + pharmacyId + "/" + code + "/" + name;
    }

    private boolean allowed(AccountPrincipal actor, String key) {
        return Access.pharmacy(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus(),
                actor.permissions(),
                key);
    }

    private void require(AccountPrincipal actor, String key, String detail) {
        if (!allowed(actor, key)) {
            throw forbidden(detail);
        }
    }

    private static boolean removePhoto(JsonNode body, EmployeeRules.Upload photo) {
        if (present(photo)
                || body == null
                || !body.has("removePhoto")
                || body.get("removePhoto").isNull()) {
            return false;
        }
        return body.get("removePhoto").asBoolean();
    }

    private static boolean present(EmployeeRules.Upload upload) {
        return upload != null && upload.body() != null && upload.body().length > 0;
    }

    private static String fileName(String name, String fallback) {
        if (name == null || name.isBlank()) {
            return fallback;
        }
        return name.trim();
    }

    private static String text(String value) {
        return value == null ? "" : value;
    }

    private static ApiProblem missing() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Employee was not found");
    }

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem forbidden(String detail) {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }
}
