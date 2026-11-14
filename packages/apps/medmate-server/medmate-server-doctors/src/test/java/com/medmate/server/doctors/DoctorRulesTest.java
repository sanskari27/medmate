package com.medmate.server.doctors;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.List;
import org.junit.jupiter.api.Test;

class DoctorRulesTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    void createRequiresTheHospitalDoctorFields() {
        ObjectNode body = json.createObjectNode();
        assertThat(DoctorRules.prepareCreate(body).problem()).isEqualTo("Doctor code is required");
        body.put("code", "  ");
        assertThat(DoctorRules.prepareCreate(body).problem()).isEqualTo("Doctor code is required");
        body.put("code", "D".repeat(33));
        assertThat(DoctorRules.prepareCreate(body).problem()).isEqualTo("Doctor code is too long");
        body.put("code", "DR-ANU");
        assertThat(DoctorRules.prepareCreate(body).problem()).isEqualTo("First name is required");
    }

    @Test
    void aValidDoctorNormalizesPhonesAndFees() throws Exception {
        ObjectNode body = (ObjectNode)
                json.readTree(
                        """
                {
                  "code": " DR-ANU ",
                  "firstName": "Anu",
                  "lastName": "Rao",
                  "displayName": "Dr Anu Rao",
                  "gender": "female",
                  "primaryMobile": "98860 11111",
                  "registrationNumber": "KMC-1",
                  "qualification": "MBBS, MD",
                  "specialization": "General medicine",
                  "workplaceName": "City Hospital",
                  "city": "Bengaluru",
                  "state": "Karnataka",
                  "pinCode": "560001",
                  "yearsExperience": 8,
                  "windows": [
                    {"type": "offline", "days": ["Monday", "monday"], "start": "09:00", "end": "13:00", "fee": 500}
                  ]
                }
                """);
        DoctorRules.Prepared prepared = DoctorRules.prepareCreate(body);
        assertThat(prepared.problem()).isNull();
        assertThat(prepared.values().code()).isEqualTo("DR-ANU");
        assertThat(prepared.values().status()).isEqualTo("active");
        assertThat(prepared.values().primaryMobile()).isEqualTo("+919886011111");
        assertThat(prepared.values().yearsExperience()).isEqualTo(8);
        assertThat(prepared.values().windows()).hasSize(1);
        assertThat(prepared.values().windows().get(0).days()).containsExactly("monday");
        assertThat(prepared.values().windows().get(0).fee().toPlainString()).isEqualTo("500");
    }

    @Test
    void windowsPhonesPinAndFilesAreRejected() throws Exception {
        ObjectNode body = valid();
        body.put("pinCode", "56000");
        assertThat(DoctorRules.prepareCreate(body).problem()).isEqualTo("PIN code is invalid");
        body.put("pinCode", "560001");
        body.put("primaryMobile", "12345");
        assertThat(DoctorRules.prepareCreate(body).problem()).isEqualTo("Mobile number is invalid");
        body.put("primaryMobile", "9886011111");
        body.withArray("windows")
                .removeAll()
                .add(
                        json.readTree(
                                """
                {"type": "visit", "days": ["monday"], "start": "09:00", "end": "13:00", "fee": "0"}
                """));
        assertThat(DoctorRules.prepareCreate(body).problem()).isEqualTo("Consultation type is not recognised");
        body.withArray("windows")
                .removeAll()
                .add(
                        json.readTree(
                                """
                {"type": "online", "days": ["monday"], "start": "13:00", "end": "09:00", "fee": "0"}
                """));
        assertThat(DoctorRules.prepareCreate(body).problem()).isEqualTo("Consultation time is invalid");
        body.withArray("windows")
                .removeAll()
                .add(
                        json.readTree(
                                """
                {"type": "both", "days": ["monday"], "start": "09:00", "end": "13:00", "fee": "1.234"}
                """));
        assertThat(DoctorRules.prepareCreate(body).problem()).isEqualTo("Consultation fee is invalid");
        body.put("yearsExperience", 100);
        body.withArray("windows")
                .removeAll()
                .add(
                        json.readTree(
                                """
                {"type": "both", "days": ["monday"], "start": "09:00", "end": "13:00", "fee": "0"}
                """));
        assertThat(DoctorRules.prepareCreate(body).problem()).isEqualTo("Years of experience is invalid");

        byte[] png = new byte[] {(byte) 0x89, 0x50, 0x4e, 0x47};
        assertThat(DoctorRules.files(new DoctorRules.Upload("a.txt", "text/plain", png), List.of()))
                .isEqualTo("File type is not allowed");
        byte[] huge = new byte[DoctorRules.PHOTO_MAX + 1];
        assertThat(DoctorRules.files(new DoctorRules.Upload("a.png", "image/png", huge), List.of()))
                .isEqualTo("File is too large");
        assertThat(DoctorRules.files(
                        null,
                        List.of(new DoctorRules.DocumentUpload(
                                " ", "pending", new DoctorRules.Upload("a.pdf", "application/pdf", png)))))
                .isEqualTo("Document type is required");
    }

    @Test
    void anOmittedUpdateKeepsTheStoredDoctor() throws Exception {
        DoctorRules.Prepared created = DoctorRules.prepareCreate(valid());
        DoctorRules.Prepared updated =
                DoctorRules.prepareUpdate(json.createObjectNode().put("code", "dr-new"), created.values());
        assertThat(updated.problem()).isNull();
        assertThat(updated.values().code()).isEqualTo("dr-new");
        assertThat(updated.values().firstName()).isEqualTo(created.values().firstName());
        assertThat(updated.values().windows()).hasSize(1);
    }

    private ObjectNode valid() throws Exception {
        return (ObjectNode)
                json.readTree(
                        """
                {
                  "code": "DR-ANU",
                  "firstName": "Anu",
                  "lastName": "Rao",
                  "displayName": "Dr Anu Rao",
                  "gender": "female",
                  "primaryMobile": "9886011111",
                  "registrationNumber": "KMC-1",
                  "qualification": "MBBS",
                  "specialization": "General medicine",
                  "workplaceName": "City Hospital",
                  "city": "Bengaluru",
                  "state": "Karnataka",
                  "pinCode": "560001",
                  "windows": [
                    {"type": "offline", "days": ["monday"], "start": "09:00", "end": "13:00", "fee": "0.00"}
                  ]
                }
                """);
    }

    @Test
    void codeKeyIgnoresCase() {
        assertThat(DoctorRules.codeKey(" DR-Anu ")).isEqualTo("dr-anu");
    }
}
