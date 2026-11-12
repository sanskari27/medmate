package com.medmate.server.employees.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.server.employees.EmployeeRules;
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
public class EmployeeController {

    private final EmployeeService employees;

    public EmployeeController(EmployeeService employees) {
        this.employees = employees;
    }

    @GetMapping("/pharmacy/employees")
    public EmployeeViews.ListResponse list(Authentication authentication) {
        return employees.list(Current.require(authentication));
    }

    @GetMapping("/pharmacy/employees/{code}")
    public EmployeeViews.OneResponse one(Authentication authentication, @PathVariable String code) {
        return employees.one(Current.require(authentication), code);
    }

    @PostMapping(path = "/pharmacy/employees", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<EmployeeViews.OneResponse> create(Authentication authentication, @RequestBody JsonNode body) {
        EmployeeViews.OneResponse created = employees.create(Current.require(authentication), body, null, List.of());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(path = "/pharmacy/employees", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EmployeeViews.OneResponse> createMultipart(
            Authentication authentication,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String dob,
            @RequestParam(required = false) String joinedOn,
            @RequestParam(required = false) String employment,
            @RequestParam(required = false) String salary,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String pan,
            @RequestParam(required = false) String aadhaar,
            @RequestParam(required = false) String bankName,
            @RequestParam(required = false) String accountName,
            @RequestParam(required = false) String accountNumber,
            @RequestParam(required = false) String ifsc,
            @RequestParam(required = false) String upi,
            @RequestParam(required = false) String emergencyName,
            @RequestParam(required = false) String emergencyPhone,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) String bloodGroup,
            @RequestPart(required = false) MultipartFile photo,
            @RequestPart(required = false) List<MultipartFile> documents,
            @RequestParam(required = false) List<String> documentTypes)
            throws IOException {
        EmployeeViews.OneResponse created = employees.create(
                Current.require(authentication),
                fields(
                        name,
                        phone,
                        position,
                        department,
                        email,
                        address,
                        dob,
                        joinedOn,
                        employment,
                        salary,
                        status,
                        pan,
                        aadhaar,
                        bankName,
                        accountName,
                        accountNumber,
                        ifsc,
                        upi,
                        emergencyName,
                        emergencyPhone,
                        note,
                        bloodGroup,
                        null),
                upload(photo),
                documents(documentTypes, documents));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping(path = "/pharmacy/employees/{code}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public EmployeeViews.OneResponse update(
            Authentication authentication, @PathVariable String code, @RequestBody JsonNode body) {
        return employees.update(Current.require(authentication), code, body, null, List.of());
    }

    @PatchMapping(path = "/pharmacy/employees/{code}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EmployeeViews.OneResponse updateMultipart(
            Authentication authentication,
            @PathVariable String code,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String position,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String dob,
            @RequestParam(required = false) String joinedOn,
            @RequestParam(required = false) String employment,
            @RequestParam(required = false) String salary,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String pan,
            @RequestParam(required = false) String aadhaar,
            @RequestParam(required = false) String bankName,
            @RequestParam(required = false) String accountName,
            @RequestParam(required = false) String accountNumber,
            @RequestParam(required = false) String ifsc,
            @RequestParam(required = false) String upi,
            @RequestParam(required = false) String emergencyName,
            @RequestParam(required = false) String emergencyPhone,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) String bloodGroup,
            @RequestParam(required = false) String removePhoto,
            @RequestPart(required = false) MultipartFile photo,
            @RequestPart(required = false) List<MultipartFile> documents,
            @RequestParam(required = false) List<String> documentTypes)
            throws IOException {
        return employees.update(
                Current.require(authentication),
                code,
                fields(
                        name,
                        phone,
                        position,
                        department,
                        email,
                        address,
                        dob,
                        joinedOn,
                        employment,
                        salary,
                        status,
                        pan,
                        aadhaar,
                        bankName,
                        accountName,
                        accountNumber,
                        ifsc,
                        upi,
                        emergencyName,
                        emergencyPhone,
                        note,
                        bloodGroup,
                        removePhoto),
                upload(photo),
                documents(documentTypes, documents));
    }

    @GetMapping("/pharmacy/employees/{code}/photo")
    public ResponseEntity<byte[]> photo(Authentication authentication, @PathVariable String code) {
        EmployeeViews.StoredFile stored = employees.openPhoto(Current.require(authentication), code);
        return bytes(stored);
    }

    @GetMapping("/pharmacy/employees/{code}/documents/{documentId}")
    public ResponseEntity<byte[]> document(
            Authentication authentication, @PathVariable String code, @PathVariable UUID documentId) {
        EmployeeViews.StoredFile stored = employees.openDocument(Current.require(authentication), code, documentId);
        return bytes(stored);
    }

    private static ResponseEntity<byte[]> bytes(EmployeeViews.StoredFile stored) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(stored.contentType()))
                .cacheControl(CacheControl.noStore())
                .body(stored.body());
    }

    private static ObjectNode fields(
            String name,
            String phone,
            String position,
            String department,
            String email,
            String address,
            String dob,
            String joinedOn,
            String employment,
            String salary,
            String status,
            String pan,
            String aadhaar,
            String bankName,
            String accountName,
            String accountNumber,
            String ifsc,
            String upi,
            String emergencyName,
            String emergencyPhone,
            String note,
            String bloodGroup,
            String removePhoto) {
        ObjectNode body = JsonNodeFactory.instance.objectNode();
        put(body, "name", name);
        put(body, "phone", phone);
        put(body, "position", position);
        put(body, "department", department);
        put(body, "email", email);
        put(body, "address", address);
        put(body, "dob", dob);
        put(body, "joinedOn", joinedOn);
        put(body, "employment", employment);
        if (salary != null) {
            try {
                body.put("salary", Integer.parseInt(salary.trim()));
            } catch (NumberFormatException exception) {
                body.put("salary", salary);
            }
        }
        put(body, "status", status);
        put(body, "pan", pan);
        put(body, "aadhaar", aadhaar);
        put(body, "bankName", bankName);
        put(body, "accountName", accountName);
        put(body, "accountNumber", accountNumber);
        put(body, "ifsc", ifsc);
        put(body, "upi", upi);
        put(body, "emergencyName", emergencyName);
        put(body, "emergencyPhone", emergencyPhone);
        put(body, "note", note);
        put(body, "bloodGroup", bloodGroup);
        if (removePhoto != null) {
            body.put("removePhoto", Boolean.parseBoolean(removePhoto));
        }
        return body;
    }

    private static void put(ObjectNode body, String field, String value) {
        if (value != null) {
            body.put(field, value);
        }
    }

    private static EmployeeRules.Upload upload(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        return new EmployeeRules.Upload(file.getOriginalFilename(), file.getContentType(), file.getBytes());
    }

    private static List<EmployeeRules.DocumentUpload> documents(List<String> types, List<MultipartFile> files)
            throws IOException {
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
        List<EmployeeRules.DocumentUpload> uploads = new ArrayList<>();
        for (int index = 0; index < present.size(); index++) {
            uploads.add(new EmployeeRules.DocumentUpload(labels.get(index), upload(present.get(index))));
        }
        return uploads;
    }
}
