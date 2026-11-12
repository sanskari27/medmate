package com.medmate.server.employees;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import org.junit.jupiter.api.Test;

class EmployeeRulesTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void nextCodeSkipsNothingAndWidensAfter999() {
        assertThat(EmployeeRules.nextCode(List.of())).isEqualTo("EMP-001");
        assertThat(EmployeeRules.nextCode(List.of("EMP-001", "EMP-003"))).isEqualTo("EMP-004");
        assertThat(EmployeeRules.nextCode(List.of("EMP-999"))).isEqualTo("EMP-1000");
        assertThat(EmployeeRules.POSITIONS).contains("Pharmacist", "Housekeeping");
        assertThat(EmployeeRules.DOCUMENT_LABELS).contains("Aadhaar card", "Pharmacist licence");
    }

    @Test
    void createNormalizesIfscAndRejectsABadPosition() throws Exception {
        ObjectNode body = person();
        body.put("ifsc", "hdfc0001234");
        EmployeeRules.Prepared prepared = EmployeeRules.prepareCreate(body);
        assertThat(prepared.problem()).isNull();
        assertThat(prepared.values().ifsc()).isEqualTo("HDFC0001234");
        assertThat(prepared.values().employment()).isEqualTo("Full-time");
        assertThat(prepared.values().salary()).isZero();
        assertThat(prepared.setsInactive()).isFalse();

        body.put("position", "Intern");
        assertThat(EmployeeRules.prepareCreate(body).problem()).isEqualTo("Position is not recognised");
        body.put("position", "Pharmacist");
        body.put("ifsc", "HDFC1001234");
        assertThat(EmployeeRules.prepareCreate(body).problem()).isEqualTo("Invalid IFSC");
    }

    @Test
    void inactiveTransitionNeedsDeleteAndOtherFieldsNeedUpdate() throws Exception {
        ObjectNode created = person();
        created.put("status", "inactive");
        EmployeeRules.Prepared inactive = EmployeeRules.prepareCreate(created);
        assertThat(inactive.setsInactive()).isTrue();

        EmployeeRules.Values current = EmployeeRules.prepareCreate(person()).values();
        ObjectNode onlyStatus = json.createObjectNode().put("status", "inactive");
        EmployeeRules.Prepared status = EmployeeRules.prepareUpdate(onlyStatus, current);
        assertThat(status.problem()).isNull();
        assertThat(status.setsInactive()).isTrue();
        assertThat(status.needsUpdate()).isFalse();

        ObjectNode both = json.createObjectNode().put("status", "inactive").put("name", "Ravi");
        EmployeeRules.Prepared changed = EmployeeRules.prepareUpdate(both, current);
        assertThat(changed.setsInactive()).isTrue();
        assertThat(changed.needsUpdate()).isTrue();
        assertThat(changed.values().name()).isEqualTo("Ravi");
    }

    @Test
    void filesAcceptPdfAndRejectTheWrongTypeAndSize() {
        assertThat(EmployeeRules.files(
                        new EmployeeRules.Upload("face.png", "image/png", new byte[] {1}),
                        List.of(new EmployeeRules.DocumentUpload(
                                "Aadhaar card",
                                new EmployeeRules.Upload("id.pdf", "application/pdf", new byte[] {1})))))
                .isNull();
        assertThat(EmployeeRules.files(
                        null,
                        List.of(new EmployeeRules.DocumentUpload(
                                "Aadhaar card", new EmployeeRules.Upload("note.txt", "text/plain", new byte[] {1})))))
                .isEqualTo("File type is not allowed");
        assertThat(EmployeeRules.files(
                        null,
                        List.of(new EmployeeRules.DocumentUpload(
                                "Passport", new EmployeeRules.Upload("id.pdf", "application/pdf", new byte[] {1})))))
                .isEqualTo("Document type is not recognised");
        byte[] large = new byte[EmployeeRules.PHOTO_MAX + 1];
        assertThat(EmployeeRules.files(new EmployeeRules.Upload("face.png", "image/png", large), List.of()))
                .isEqualTo("File is too large");
    }

    private ObjectNode person() {
        ObjectNode body = json.createObjectNode();
        body.put("name", "Anjali Menon");
        body.put("phone", "9886012345");
        body.put("position", "Pharmacist");
        return body;
    }
}
