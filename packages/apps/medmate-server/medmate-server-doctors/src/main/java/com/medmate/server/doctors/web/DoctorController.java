package com.medmate.server.doctors.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.server.doctors.DoctorRules;
import com.medmate.server.identity.web.Current;
import com.medmate.server.shared.error.ApiProblem;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Profile({"local", "prod", "identity-it"})
public class DoctorController {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final DoctorService doctors;

    public DoctorController(DoctorService doctors) {
        this.doctors = doctors;
    }

    @GetMapping("/pharmacy/doctors")
    public DoctorViews.ListResponse list(Authentication authentication) {
        return doctors.list(Current.require(authentication));
    }

    @GetMapping("/pharmacy/doctors/{id}")
    public DoctorViews.OneResponse one(Authentication authentication, @PathVariable UUID id) {
        return doctors.one(Current.require(authentication), id);
    }

    @PostMapping(path = "/pharmacy/doctors", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<DoctorViews.OneResponse> create(Authentication authentication, @RequestBody JsonNode body) {
        DoctorViews.OneResponse created = doctors.create(Current.require(authentication), body, null, List.of());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(path = "/pharmacy/doctors", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DoctorViews.OneResponse> createMultipart(
            Authentication authentication,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String displayName,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String registrationNumber,
            @RequestParam(required = false) String registrationCouncil,
            @RequestParam(required = false) String registrationState,
            @RequestParam(required = false) String qualification,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String subSpecialization,
            @RequestParam(required = false) String yearsExperience,
            @RequestParam(required = false) String primaryMobile,
            @RequestParam(required = false) String alternateMobile,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String whatsapp,
            @RequestParam(required = false) String relationshipStatus,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String workplaceName,
            @RequestParam(required = false) String workplaceType,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String pinCode,
            @RequestParam(required = false) String workplacePhone,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String windows,
            @RequestPart(required = false) MultipartFile photo,
            @RequestPart(required = false) List<MultipartFile> documents,
            @RequestParam(required = false) List<String> documentTypes,
            @RequestParam(required = false) List<String> documentStatuses)
            throws IOException {
        ObjectNode body = fields(
                code,
                firstName,
                lastName,
                displayName,
                gender,
                status,
                registrationNumber,
                registrationCouncil,
                registrationState,
                qualification,
                specialization,
                subSpecialization,
                yearsExperience,
                primaryMobile,
                alternateMobile,
                email,
                whatsapp,
                relationshipStatus,
                notes,
                workplaceName,
                workplaceType,
                address,
                city,
                state,
                pinCode,
                workplacePhone,
                windows,
                null,
                null);
        if (departmentId != null) {
            body.put("departmentId", departmentId);
        }
        DoctorViews.OneResponse created = doctors.create(
                Current.require(authentication),
                body,
                upload(photo),
                documents(documentTypes, documentStatuses, documents));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping(path = "/pharmacy/doctors/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public DoctorViews.OneResponse update(
            Authentication authentication, @PathVariable UUID id, @RequestBody JsonNode body) {
        return doctors.update(Current.require(authentication), id, body, null, List.of());
    }

    @PatchMapping(path = "/pharmacy/doctors/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DoctorViews.OneResponse updateMultipart(
            Authentication authentication,
            @PathVariable UUID id,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String firstName,
            @RequestParam(required = false) String lastName,
            @RequestParam(required = false) String displayName,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String registrationNumber,
            @RequestParam(required = false) String registrationCouncil,
            @RequestParam(required = false) String registrationState,
            @RequestParam(required = false) String qualification,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String subSpecialization,
            @RequestParam(required = false) String yearsExperience,
            @RequestParam(required = false) String primaryMobile,
            @RequestParam(required = false) String alternateMobile,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String whatsapp,
            @RequestParam(required = false) String relationshipStatus,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) String workplaceName,
            @RequestParam(required = false) String workplaceType,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String pinCode,
            @RequestParam(required = false) String workplacePhone,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String windows,
            @RequestParam(required = false) String removePhoto,
            @RequestParam(required = false) String documentUpdates,
            @RequestPart(required = false) MultipartFile photo,
            @RequestPart(required = false) List<MultipartFile> documents,
            @RequestParam(required = false) List<String> documentTypes,
            @RequestParam(required = false) List<String> documentStatuses)
            throws IOException {
        ObjectNode body = fields(
                code,
                firstName,
                lastName,
                displayName,
                gender,
                status,
                registrationNumber,
                registrationCouncil,
                registrationState,
                qualification,
                specialization,
                subSpecialization,
                yearsExperience,
                primaryMobile,
                alternateMobile,
                email,
                whatsapp,
                relationshipStatus,
                notes,
                workplaceName,
                workplaceType,
                address,
                city,
                state,
                pinCode,
                workplacePhone,
                windows,
                removePhoto,
                documentUpdates);
        if (departmentId != null) {
            body.put("departmentId", departmentId);
        }
        return doctors.update(
                Current.require(authentication),
                id,
                body,
                upload(photo),
                documents(documentTypes, documentStatuses, documents));
    }

    @GetMapping("/pharmacy/doctors/{id}/photo")
    public ResponseEntity<byte[]> photo(Authentication authentication, @PathVariable UUID id) {
        return bytes(doctors.openPhoto(Current.require(authentication), id));
    }

    @GetMapping("/pharmacy/doctors/{id}/documents/{documentId}")
    public ResponseEntity<byte[]> document(
            Authentication authentication, @PathVariable UUID id, @PathVariable UUID documentId) {
        return bytes(doctors.openDocument(Current.require(authentication), id, documentId));
    }

    private static ResponseEntity<byte[]> bytes(DoctorViews.StoredFile stored) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(stored.contentType()))
                .cacheControl(CacheControl.noStore())
                .body(stored.body());
    }

    private static ObjectNode fields(
            String code,
            String firstName,
            String lastName,
            String displayName,
            String gender,
            String status,
            String registrationNumber,
            String registrationCouncil,
            String registrationState,
            String qualification,
            String specialization,
            String subSpecialization,
            String yearsExperience,
            String primaryMobile,
            String alternateMobile,
            String email,
            String whatsapp,
            String relationshipStatus,
            String notes,
            String workplaceName,
            String workplaceType,
            String address,
            String city,
            String state,
            String pinCode,
            String workplacePhone,
            String windows,
            String removePhoto,
            String documentUpdates) {
        ObjectNode body = JsonNodeFactory.instance.objectNode();
        put(body, "code", code);
        put(body, "firstName", firstName);
        put(body, "lastName", lastName);
        put(body, "displayName", displayName);
        put(body, "gender", gender);
        put(body, "status", status);
        put(body, "registrationNumber", registrationNumber);
        put(body, "registrationCouncil", registrationCouncil);
        put(body, "registrationState", registrationState);
        put(body, "qualification", qualification);
        put(body, "specialization", specialization);
        put(body, "subSpecialization", subSpecialization);
        if (yearsExperience != null) {
            String trimmed = yearsExperience.trim();
            if (trimmed.isEmpty()) {
                body.put("yearsExperience", "");
            } else {
                try {
                    body.put("yearsExperience", Integer.parseInt(trimmed));
                } catch (NumberFormatException exception) {
                    body.put("yearsExperience", trimmed);
                }
            }
        }
        put(body, "primaryMobile", primaryMobile);
        put(body, "alternateMobile", alternateMobile);
        put(body, "email", email);
        put(body, "whatsapp", whatsapp);
        put(body, "relationshipStatus", relationshipStatus);
        put(body, "notes", notes);
        put(body, "workplaceName", workplaceName);
        put(body, "workplaceType", workplaceType);
        put(body, "address", address);
        put(body, "city", city);
        put(body, "state", state);
        put(body, "pinCode", pinCode);
        put(body, "workplacePhone", workplacePhone);
        if (windows != null) {
            body.set("windows", array(windows, "A consultation window is required"));
        }
        if (removePhoto != null) {
            body.put("removePhoto", Boolean.parseBoolean(removePhoto));
        }
        if (documentUpdates != null) {
            body.set("documents", array(documentUpdates, "Verification status is not recognised"));
        }
        return body;
    }

    private static ArrayNode array(String raw, String detail) {
        try {
            JsonNode node = JSON.readTree(raw);
            if (node instanceof ArrayNode array) {
                return array;
            }
        } catch (IOException exception) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
        }
        throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static void put(ObjectNode body, String field, String value) {
        if (value != null) {
            body.put(field, value);
        }
    }

    private static DoctorRules.Upload upload(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        return new DoctorRules.Upload(file.getOriginalFilename(), file.getContentType(), file.getBytes());
    }

    private static List<DoctorRules.DocumentUpload> documents(
            List<String> types, List<String> statuses, List<MultipartFile> files) throws IOException {
        List<MultipartFile> present = new ArrayList<>();
        if (files != null) {
            for (MultipartFile file : files) {
                if (file != null && !file.isEmpty()) {
                    present.add(file);
                }
            }
        }
        List<String> labels = types == null ? List.of() : types;
        if (present.size() != labels.size()) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Each document needs a type");
        }
        if (statuses != null && statuses.size() != present.size()) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Verification status is not recognised");
        }
        List<DoctorRules.DocumentUpload> uploads = new ArrayList<>();
        for (int index = 0; index < present.size(); index++) {
            String status = statuses == null ? null : statuses.get(index);
            uploads.add(new DoctorRules.DocumentUpload(labels.get(index), status, upload(present.get(index))));
        }
        return uploads;
    }
}
