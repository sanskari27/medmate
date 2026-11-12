package com.medmate.server.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.mail.RecordingMailSender;
import com.medmate.server.identity.sms.RecordingSmsSender;
import com.medmate.server.identity.web.Current;
import com.medmate.server.shared.error.ApiProblem;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.concurrent.TimeUnit;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("identity-it")
@Import(IdentityFlowIT.Probe.class)
class IdentityFlowIT {

    private static final PostgreSQLContainer<?> POSTGRES = startContainer();

    private static PostgreSQLContainer<?> startContainer() {
        if (!dockerPresent()) {
            return null;
        }
        PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
        postgres.start();
        return postgres;
    }

    private static boolean dockerPresent() {
        try {
            Process process = new ProcessBuilder("docker", "info")
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                    .redirectError(ProcessBuilder.Redirect.DISCARD)
                    .start();
            if (!process.waitFor(15, TimeUnit.SECONDS)) {
                process.destroyForcibly();
                return false;
            }
            return process.exitValue() == 0;
        } catch (Exception exception) {
            return false;
        }
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        if (POSTGRES != null) {
            registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
            registry.add("spring.datasource.username", POSTGRES::getUsername);
            registry.add("spring.datasource.password", POSTGRES::getPassword);
            return;
        }
        registry.add("spring.datasource.url", () -> "jdbc:postgresql://127.0.0.1:5432/medmate_server_it");
        registry.add("spring.datasource.username", () -> "pharmacy");
        registry.add("spring.datasource.password", () -> "pharmacy");
    }

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private RecordingSmsSender sms;

    @Autowired
    private RecordingMailSender mail;

    @Autowired
    private DataSource dataSource;

    @BeforeEach
    void clearDeliveries() throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("TRUNCATE account, otp_challenge CASCADE");
        }
        sms.clear();
        mail.clear();
    }

    @Test
    void onePhoneCanBeACustomerAndAPharmacyOwner() {
        JsonNode owner = verify("9811111101", "pharmacy", "signup");
        JsonNode customer = verify("9811111101", "customer", "login");

        assertThat(owner.get("account").get("id").asText())
                .isNotEqualTo(customer.get("account").get("id").asText());
        assertThat(owner.get("account").get("accountType").asText()).isEqualTo("pharmacy");
        assertThat(owner.get("account").get("verificationStatus").asText()).isEqualTo("incomplete");
        assertThat(customer.get("account").get("accountType").asText()).isEqualTo("customer");
        assertThat(customer.get("account").get("pharmacyId").isNull()).isTrue();
    }

    @Test
    void platformLoginUsesTheStaffAccount() {
        bootstrap("9811111141");
        String adminToken = token(verify("9811111141", "admin", "login"));
        ResponseEntity<JsonNode> created = rest.exchange(
                "/staff",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of(
                                "phone",
                                "9811111142",
                                "displayName",
                                "Nia",
                                "subtypes",
                                List.of("finance", "compliance")),
                        bearer(adminToken, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        JsonNode session = verify("9811111142", "platform", "login");
        assertThat(session.get("account").get("accountType").asText()).isEqualTo("staff");
        JsonNode subtypes = session.get("account").get("subtypes");
        assertThat(subtypes).hasSize(2);
        assertThat(subtypes.get(0).asText()).isEqualTo("compliance");
        assertThat(subtypes.get(1).asText()).isEqualTo("finance");
    }

    @Test
    void unknownPlatformPhoneIsRejectedWithoutACode() {
        ResponseEntity<JsonNode> sent = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111143", "accountType", "platform", "purpose", "login"), json()),
                JsonNode.class);
        assertThat(sent.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(sent.getBody().get("mode").asText()).isEqualTo("otp");
        assertThat(sms.latestCode("+919811111143")).isNull();

        ResponseEntity<JsonNode> verified = rest.exchange(
                "/auth/otp/verify",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of(
                                "phone", "9811111143", "accountType", "platform", "purpose", "login", "code", "000000"),
                        json()),
                JsonNode.class);
        assertThat(verified.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(verified.getBody().get("detail").asText()).isEqualTo("Code was not accepted");
    }

    @Test
    void platformPhonesStayOnOneAccountType() {
        bootstrap("9811111144");
        String adminToken = token(verify("9811111144", "admin", "login"));
        ResponseEntity<JsonNode> staffOnAdmin = rest.exchange(
                "/staff",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111144", "displayName", "Ada", "subtypes", List.of("sales")),
                        bearer(adminToken, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(staffOnAdmin.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(staffOnAdmin.getBody().get("detail").asText())
                .isEqualTo("A platform admin already exists for this phone");

        ResponseEntity<JsonNode> staff = rest.exchange(
                "/staff",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111145", "displayName", "Nia", "subtypes", List.of("support")),
                        bearer(adminToken, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(staff.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        HttpHeaders headers = json();
        headers.setBearerAuth("test-bootstrap");
        ResponseEntity<JsonNode> bootstrapStaff = rest.exchange(
                "/auth/admin-bootstrap",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("phone", "9811111145"), headers),
                JsonNode.class);
        assertThat(bootstrapStaff.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(bootstrapStaff.getBody().get("detail").asText())
                .isEqualTo("A staff account already exists for this phone");
    }

    @Test
    void anIncompleteSubmissionDoesNotAdvance() {
        String token = token(verify("9811111102", "pharmacy", "signup"));
        ResponseEntity<JsonNode> rejected = rest.exchange(
                "/pharmacy/application",
                HttpMethod.POST,
                new HttpEntity<>(
                        new LinkedMultiValueMap<String, Object>(), bearer(token, MediaType.MULTIPART_FORM_DATA)),
                JsonNode.class);

        assertThat(rejected.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(verification(token).get("status").asText()).isEqualTo("incomplete");
        assertThat(business(token).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(business(token).getBody().get("detail").asText()).isEqualTo("Pharmacy is not approved");
    }

    @Test
    void reviewRequiresComplianceThenAdminAndARejectionCanBeResubmitted() {
        String ownerToken = token(verify("9811111103", "pharmacy", "signup"));
        String pharmacyId = verification(ownerToken).get("pharmacyId").asText();
        JsonNode admin = bootstrap("9811111199");
        assertThat(bootstrap("9811111199").get("created").asBoolean()).isFalse();
        String adminToken = token(verify("9811111199", "admin", "login"));
        ResponseEntity<JsonNode> incompleteResponse = applicationDetail(adminToken, pharmacyId);
        assertThat(incompleteResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode incomplete = incompleteResponse.getBody();
        assertThat(incomplete.get("status").asText()).isEqualTo("incomplete");
        assertThat(incomplete.get("name").isNull()).isTrue();
        assertThat(incomplete.get("submittedAt").isNull()).isTrue();
        assertThat(incomplete.get("documents")).isEmpty();
        assertThat(incomplete.get("phone").asText()).isEqualTo("+919811111103");
        assertThat(incomplete.get("lowStockAlerts").asBoolean()).isTrue();
        assertThat(incomplete.get("rejection").isNull()).isTrue();
        assertThat(incomplete.get("pharmacyType").isNull()).isTrue();

        JsonNode submitted = submit(ownerToken);
        assertThat(submitted.get("status").asText()).isEqualTo("pending_compliance");
        ResponseEntity<byte[]> document = rest.exchange(
                "/pharmacies/" + pharmacyId + "/documents/gst",
                HttpMethod.GET,
                new HttpEntity<>(bearer(ownerToken, MediaType.APPLICATION_JSON)),
                byte[].class);
        assertThat(document.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(document.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
        assertThat(mail.messages())
                .anyMatch(message -> message.subject().equals("We received your pharmacy application"));

        ResponseEntity<JsonNode> detailResponse = applicationDetail(adminToken, pharmacyId);
        assertThat(detailResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode detail = detailResponse.getBody();
        assertThat(detail.get("pharmacyId").asText()).isEqualTo(pharmacyId);
        assertThat(detail.get("status").asText()).isEqualTo("pending_compliance");
        assertThat(detail.get("rejection").isNull()).isTrue();
        assertThat(detail.get("phone").asText()).isEqualTo("+919811111103");
        assertThat(detail.get("name").asText()).isEqualTo("Care Pharmacy");
        assertThat(detail.get("tagline").asText()).isEqualTo("Open late");
        assertThat(detail.get("email").asText()).isEqualTo("owner@example.com");
        assertThat(detail.get("address").asText()).isEqualTo("12 Market Road");
        assertThat(detail.get("city").asText()).isEqualTo("Bengaluru");
        assertThat(detail.get("state").asText()).isEqualTo("Karnataka");
        assertThat(detail.get("pincode").asText()).isEqualTo("560001");
        assertThat(detail.get("businessTypes").get(0).asText()).isEqualTo("Retail Pharmacy");
        assertThat(detail.get("industry").asText()).isEqualTo("Pharmacy & Healthcare");
        assertThat(detail.get("registrationType").asText()).isEqualTo("Proprietorship");
        assertThat(detail.get("pharmacyType").asText()).isEqualTo("pharmacy");
        assertThat(detail.get("gstin").asText()).isEqualTo("29ABCDE1234F1Z5");
        assertThat(detail.get("pan").asText()).isEqualTo("ABCDE1234F");
        assertThat(detail.get("drugLicenceNo").asText()).isEqualTo("DL-1");
        assertThat(detail.get("fssaiNo").asText()).isEqualTo("FSSAI-1");
        assertThat(detail.get("tradeLicenceNo").asText()).isEqualTo("TL-1");
        assertThat(detail.get("enableTds").asBoolean()).isFalse();
        assertThat(detail.get("enableTcs").asBoolean()).isFalse();
        assertThat(detail.get("pharmacistName").asText()).isEqualTo("Asha Rao, B.Pharm (Reg. No. 12)");
        assertThat(detail.get("invoicePrefix").asText()).isEqualTo("CARE");
        assertThat(detail.get("terms").asText()).isEqualTo("Goods once sold");
        assertThat(detail.get("acceptOnlineOrders").asBoolean()).isTrue();
        assertThat(detail.get("selfOrderKiosk").asBoolean()).isFalse();
        assertThat(detail.get("eInvoicing").asBoolean()).isFalse();
        assertThat(detail.get("looseSelling").asBoolean()).isTrue();
        assertThat(detail.get("lowStockAlerts").asBoolean()).isTrue();
        assertThat(detail.get("submittedAt").asText()).isNotBlank();
        assertThat(detail.get("documents").findValuesAsText("slot"))
                .containsExactly(
                        "logo",
                        "gst",
                        "pan",
                        "drug-licence",
                        "fssai",
                        "trade-licence",
                        "pharmacist-certificate",
                        "signature");
        assertThat(detail.get("documents").findValuesAsText("contentType"))
                .containsExactly(
                        "image/png",
                        "application/pdf",
                        "image/png",
                        "image/png",
                        "image/png",
                        "image/png",
                        "application/pdf",
                        "image/png");
        assertThat(detail.findValues("objectKey")).isEmpty();
        for (JsonNode stored : detail.get("documents")) {
            assertThat(stored.get("url").asText())
                    .isEqualTo("/pharmacies/" + pharmacyId + "/documents/"
                            + stored.get("slot").asText());
        }
        ResponseEntity<byte[]> reviewedDocument = rest.exchange(
                "/pharmacies/" + pharmacyId + "/documents/gst",
                HttpMethod.GET,
                new HttpEntity<>(bearer(adminToken, MediaType.APPLICATION_JSON)),
                byte[].class);
        assertThat(reviewedDocument.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(reviewedDocument.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);

        String financeToken = tokenForStaff(adminToken, "9811111104", List.of("finance"));
        assertThat(applicationDetail(financeToken, pharmacyId).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(applicationDetail(ownerToken, pharmacyId).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        JsonNode ownerRead = ownerApplication(ownerToken).getBody();
        assertThat(ownerRead.get("pharmacyType").asText()).isEqualTo("pharmacy");
        assertThat(ownerRead.get("name").asText()).isEqualTo("Care Pharmacy");
        assertThat(ownerApplication(adminToken).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(applicationDetail(adminToken, "00000000-0000-4000-8000-000000009999")
                        .getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(decision(financeToken, pharmacyId, "compliance-decision", "approve", "ok")
                        .getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(decision(adminToken, pharmacyId, "admin-decision", "approve", "ok")
                        .getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        assertThat(decision(adminToken, pharmacyId, "compliance-decision", "reject", "Missing seal")
                        .getBody()
                        .get("status")
                        .asText())
                .isEqualTo("rejected");
        JsonNode rejected = verification(ownerToken);
        assertThat(rejected.get("rejection").get("stage").asText()).isEqualTo("compliance");
        assertThat(rejected.get("rejection").get("comment").asText()).isEqualTo("Missing seal");

        assertThat(submit(ownerToken).get("status").asText()).isEqualTo("pending_compliance");
        String complianceToken = tokenForStaff(adminToken, "9811111105", List.of("compliance"));
        ResponseEntity<JsonNode> complianceResponse = applicationDetail(complianceToken, pharmacyId);
        assertThat(complianceResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode complianceRead = complianceResponse.getBody();
        assertThat(complianceRead.get("status").asText()).isEqualTo("pending_compliance");
        assertThat(complianceRead.get("name").asText()).isEqualTo("Care Pharmacy");
        assertThat(decision(complianceToken, pharmacyId, "compliance-decision", "approve", "Looks complete")
                        .getBody()
                        .get("status")
                        .asText())
                .isEqualTo("pending_admin");
        JsonNode approved = decision(adminToken, pharmacyId, "admin-decision", "approve", "Approved")
                .getBody();
        assertThat(approved.get("status").asText()).isEqualTo("approved");
        assertThat(mail.messages()).anyMatch(message -> message.subject().equals("Your pharmacy is approved"));
        assertThat(admin.get("accountId").asText()).isNotBlank();
    }

    @Test
    void aRejectedResubmitKeepsAnOmittedDocumentAndReplacesAnother() {
        String ownerToken = token(verify("9811111112", "pharmacy", "signup"));
        String pharmacyId = verification(ownerToken).get("pharmacyId").asText();
        assertThat(submit(ownerToken).get("status").asText()).isEqualTo("pending_compliance");
        bootstrap("9811111113");
        String adminToken = token(verify("9811111113", "admin", "login"));
        assertThat(decision(adminToken, pharmacyId, "compliance-decision", "reject", "Missing seal")
                        .getBody()
                        .get("status")
                        .asText())
                .isEqualTo("rejected");

        JsonNode rejected = ownerApplication(ownerToken).getBody();
        assertThat(rejected.get("status").asText()).isEqualTo("rejected");
        assertThat(rejected.get("rejection").get("comment").asText()).isEqualTo("Missing seal");
        assertThat(rejected.get("pharmacyType").asText()).isEqualTo("pharmacy");
        assertThat(contentType(rejected, "gst")).isEqualTo("application/pdf");
        assertThat(contentType(rejected, "pan")).isEqualTo("image/png");

        MultiValueMap<String, Object> invalid = application();
        invalid.remove("pharmacyType");
        ResponseEntity<JsonNode> bad = postApplication(ownerToken, invalid);
        assertThat(bad.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        JsonNode unchanged = ownerApplication(ownerToken).getBody();
        assertThat(unchanged.get("status").asText()).isEqualTo("rejected");
        assertThat(contentType(unchanged, "gst")).isEqualTo("application/pdf");
        assertThat(contentType(unchanged, "pan")).isEqualTo("image/png");

        MultiValueMap<String, Object> again = application();
        again.remove("gstCertificate");
        again.remove("logo");
        again.set("panCard", file("application/pdf"));
        ResponseEntity<JsonNode> resubmitted = postApplication(ownerToken, again);
        assertThat(resubmitted.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resubmitted.getBody().get("status").asText()).isEqualTo("pending_compliance");
        JsonNode kept = ownerApplication(ownerToken).getBody();
        assertThat(contentType(kept, "gst")).isEqualTo("application/pdf");
        assertThat(contentType(kept, "logo")).isEqualTo("image/png");
        assertThat(contentType(kept, "pan")).isEqualTo("application/pdf");
        assertThat(kept.get("documents").findValuesAsText("slot")).contains("signature", "pharmacist-certificate");
    }

    @Test
    void anApprovedOwnerSetsAPinAndStaffReceiveOnlyGrantedKeys() {
        String ownerToken = token(verify("9811111106", "pharmacy", "signup"));
        String pharmacyId = submit(ownerToken).get("pharmacyId").asText();
        bootstrap("9811111198");
        String adminToken = token(verify("9811111198", "admin", "login"));
        String complianceToken = tokenForStaff(adminToken, "9811111107", List.of("compliance", "sales"));
        decision(complianceToken, pharmacyId, "compliance-decision", "approve", "ok");
        decision(adminToken, pharmacyId, "admin-decision", "approve", "ok");

        JsonNode otpLogin = verify("9811111106", "pharmacy", "login");
        assertThat(otpLogin.get("account").get("pinSetupRequired").asBoolean()).isTrue();
        ResponseEntity<JsonNode> pinSet = rest.exchange(
                "/auth/pin/set",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("pin", "2468"), bearer(token(otpLogin), MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(pinSet.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(pinSet.getBody().get("pinSetupRequired").asBoolean()).isFalse();

        ResponseEntity<JsonNode> mode = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111106", "accountType", "pharmacy", "purpose", "login"), json()),
                JsonNode.class);
        assertThat(mode.getBody().get("mode").asText()).isEqualTo("pin");
        ResponseEntity<JsonNode> pinLogin = rest.exchange(
                "/auth/pin",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111106", "accountType", "pharmacy", "pin", "2468"), json()),
                JsonNode.class);
        assertThat(pinLogin.getStatusCode()).isEqualTo(HttpStatus.OK);
        String refreshedOwner = token(pinLogin.getBody());

        ResponseEntity<JsonNode> created = rest.exchange(
                "/pharmacy/staff",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of(
                                "phone",
                                "9811111108",
                                "displayName",
                                "Counter",
                                "pin",
                                "1357",
                                "permissions",
                                List.of("users:read")),
                        bearer(refreshedOwner, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(created.getBody().has("pin")).isFalse();
        assertThat(created.getBody().get("pinSet").asBoolean()).isTrue();
        assertThat(created.getBody().get("permissions").get(0).asText()).isEqualTo("users:read");

        ResponseEntity<JsonNode> rejectedKey = rest.exchange(
                "/pharmacy/staff",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of(
                                "phone",
                                "9811111187",
                                "displayName",
                                "Counter",
                                "pin",
                                "1357",
                                "permissions",
                                List.of("billing:nope")),
                        bearer(refreshedOwner, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(rejectedKey.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(rejectedKey.getBody().get("detail").asText()).isEqualTo("Permission key is invalid");

        ResponseEntity<JsonNode> staffMode = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111108", "accountType", "pharmacy", "purpose", "login"), json()),
                JsonNode.class);
        assertThat(staffMode.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(staffMode.getBody().get("mode").asText()).isEqualTo("pin");
        ResponseEntity<JsonNode> staffPin = rest.exchange(
                "/auth/pin",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111108", "accountType", "pharmacy", "pin", "1357"), json()),
                JsonNode.class);
        assertThat(staffPin.getStatusCode()).isEqualTo(HttpStatus.OK);
        String staffToken = token(staffPin.getBody());
        assertThat(permission(staffToken, "users:read").getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(permission(staffToken, "support:write").getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(ownerApplication(staffToken).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(ownerApplication(adminToken).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(business(refreshedOwner).getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<JsonNode> listed = rest.exchange(
                "/pharmacy/staff",
                HttpMethod.GET,
                new HttpEntity<>(bearer(refreshedOwner, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(listed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listed.getBody()).hasSize(1);
        assertThat(listed.getBody().get(0).get("phone").asText()).isEqualTo("+919811111108");
        assertThat(listed.getBody().get(0).has("pin")).isFalse();
        assertThat(listed.getBody().findValuesAsText("phone")).doesNotContain("+919811111106");

        String staffId = created.getBody().get("id").asText();
        ResponseEntity<JsonNode> updated = rest.exchange(
                "/pharmacy/staff/" + staffId,
                HttpMethod.PATCH,
                new HttpEntity<>(
                        java.util.Map.of(
                                "displayName",
                                "Counter Two",
                                "phone",
                                "9811111188",
                                "pin",
                                "9753",
                                "permissions",
                                List.of("users:read", "support:read")),
                        bearer(refreshedOwner, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updated.getBody().get("phone").asText()).isEqualTo("+919811111188");
        assertThat(updated.getBody().has("pin")).isFalse();
        assertThat(rest.exchange(
                                "/auth/pin",
                                HttpMethod.POST,
                                new HttpEntity<>(
                                        java.util.Map.of(
                                                "phone", "9811111108", "accountType", "pharmacy", "pin", "1357"),
                                        json()),
                                JsonNode.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(rest.exchange(
                                "/auth/pin",
                                HttpMethod.POST,
                                new HttpEntity<>(
                                        java.util.Map.of(
                                                "phone", "9811111188", "accountType", "pharmacy", "pin", "9753"),
                                        json()),
                                JsonNode.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.OK);

        ResponseEntity<JsonNode> staffReset = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111188", "accountType", "pharmacy", "purpose", "pin_reset"),
                        json()),
                JsonNode.class);
        assertThat(staffReset.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(staffReset.getBody().get("detail").asText()).isEqualTo("PIN reset is not available");

        ResponseEntity<JsonNode> disabled = rest.exchange(
                "/pharmacy/staff/" + staffId,
                HttpMethod.PATCH,
                new HttpEntity<>(
                        java.util.Map.of("disabled", true), bearer(refreshedOwner, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(disabled.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(disabled.getBody().get("disabled").asBoolean()).isTrue();
        ResponseEntity<JsonNode> disabledPin = rest.exchange(
                "/auth/pin",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111188", "accountType", "pharmacy", "pin", "9753"), json()),
                JsonNode.class);
        assertThat(disabledPin.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(disabledPin.getBody().get("detail").asText()).isEqualTo("PIN was not accepted");
        ResponseEntity<JsonNode> stillListed = rest.exchange(
                "/pharmacy/staff",
                HttpMethod.GET,
                new HttpEntity<>(bearer(refreshedOwner, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(stillListed.getBody()).hasSize(1);
        assertThat(stillListed.getBody().get(0).get("disabled").asBoolean()).isTrue();
    }

    @Test
    void refreshRotatesAndSignOutRevokes() {
        JsonNode session = verify("9811111109", "rider", "login");
        ResponseEntity<JsonNode> refreshed = rest.exchange(
                "/auth/refresh",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of(
                                "refreshToken", session.get("refreshToken").asText()),
                        json()),
                JsonNode.class);
        assertThat(refreshed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(refreshed.getBody().get("refreshToken").asText())
                .isNotEqualTo(session.get("refreshToken").asText());

        ResponseEntity<JsonNode> oldRefresh = rest.exchange(
                "/auth/refresh",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of(
                                "refreshToken", session.get("refreshToken").asText()),
                        json()),
                JsonNode.class);
        assertThat(oldRefresh.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<Void> signedOut = rest.exchange(
                "/auth/sign-out",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of(
                                "refreshToken",
                                refreshed.getBody().get("refreshToken").asText()),
                        json()),
                Void.class);
        assertThat(signedOut.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        ResponseEntity<JsonNode> afterSignOut = rest.exchange(
                "/auth/refresh",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of(
                                "refreshToken",
                                refreshed.getBody().get("refreshToken").asText()),
                        json()),
                JsonNode.class);
        assertThat(afterSignOut.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void pharmacyOwnersCanBeListedAndBlocked() {
        JsonNode ownerLogin = verify("9811111121", "pharmacy", "signup");
        String ownerToken = token(ownerLogin);
        String ownerRefresh = ownerLogin.get("refreshToken").asText();
        String pharmacyId = submit(ownerToken).get("pharmacyId").asText();
        verify("9811111122", "pharmacy", "signup");
        bootstrap("9811111190");
        String adminToken = token(verify("9811111190", "admin", "login"));
        String complianceToken = tokenForStaff(adminToken, "9811111127", List.of("compliance"));
        decision(complianceToken, pharmacyId, "compliance-decision", "approve", "ok");
        decision(adminToken, pharmacyId, "admin-decision", "approve", "ok");

        JsonNode pinReady = verify("9811111121", "pharmacy", "login");
        assertThat(pinReady.get("account").get("disabled").asBoolean()).isFalse();
        rest.exchange(
                "/auth/pin/set",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("pin", "2468"), bearer(token(pinReady), MediaType.APPLICATION_JSON)),
                JsonNode.class);
        JsonNode ownerPin = rest.exchange(
                        "/auth/pin",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                java.util.Map.of("phone", "9811111121", "accountType", "pharmacy", "pin", "2468"),
                                json()),
                        JsonNode.class)
                .getBody();
        ownerToken = token(ownerPin);
        ownerRefresh = ownerPin.get("refreshToken").asText();
        assertThat(rest.exchange(
                                "/pharmacy/staff",
                                HttpMethod.POST,
                                new HttpEntity<>(
                                        java.util.Map.of(
                                                "phone",
                                                "9811111123",
                                                "displayName",
                                                "Counter",
                                                "pin",
                                                "1357",
                                                "permissions",
                                                List.of("users:read")),
                                        bearer(ownerToken, MediaType.APPLICATION_JSON)),
                                JsonNode.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
        JsonNode staffLogin = rest.exchange(
                        "/auth/pin",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                java.util.Map.of("phone", "9811111123", "accountType", "pharmacy", "pin", "1357"),
                                json()),
                        JsonNode.class)
                .getBody();
        assertThat(staffLogin.get("accessToken").asText()).isNotBlank();
        String staffToken = token(staffLogin);
        String staffRefresh = staffLogin.get("refreshToken").asText();

        String financeToken = tokenForStaff(adminToken, "9811111124", List.of("finance"));
        String salesToken = tokenForStaff(adminToken, "9811111125", List.of("sales"));
        String customerToken = token(verify("9811111126", "customer", "login"));

        ResponseEntity<JsonNode> listed = owners(financeToken);
        assertThat(listed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listed.getBody()).hasSize(2);
        assertThat(listed.getBody().get(0).get("name").asText()).isEqualTo("Care Pharmacy");
        assertThat(listed.getBody().get(0).get("phone").asText()).isEqualTo("+919811111121");
        assertThat(listed.getBody().get(0).get("status").asText()).isEqualTo("approved");
        assertThat(listed.getBody().get(0).get("blockState").asText()).isEqualTo("clear");
        assertThat(listed.getBody().get(1).get("name").isNull()).isTrue();
        assertThat(listed.getBody().findValuesAsText("phone")).containsExactly("+919811111121", "+919811111122");
        assertThat(owners(ownerToken).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(owners(customerToken).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<byte[]> financeDocument = rest.exchange(
                "/pharmacies/" + pharmacyId + "/documents/gst",
                HttpMethod.GET,
                new HttpEntity<>(bearer(financeToken, MediaType.APPLICATION_JSON)),
                byte[].class);
        assertThat(financeDocument.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<JsonNode> blank = blockRequest(salesToken, pharmacyId, " ");
        assertThat(blank.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(blank.getBody().get("detail").asText()).isEqualTo("A reason is required.");
        ResponseEntity<JsonNode> adminRequest = blockRequest(adminToken, pharmacyId, "Needs a review");
        assertThat(adminRequest.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(adminRequest.getBody().get("detail").asText()).isEqualTo("Platform admin decides a block directly.");

        ResponseEntity<JsonNode> requested = blockRequest(salesToken, pharmacyId, "Missing licence");
        assertThat(requested.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(requested.getBody().get("blockState").asText()).isEqualTo("requested");
        String requestId = requested.getBody().get("request").get("id").asText();
        assertThat(requested.getBody().get("request").get("reason").asText()).isEqualTo("Missing licence");
        assertThat(blockRequest(salesToken, pharmacyId, "Again").getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
        assertThat(block(adminToken, pharmacyId).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        ResponseEntity<JsonNode> rejected = blockDecision(adminToken, pharmacyId, requestId, "reject");
        assertThat(rejected.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(rejected.getBody().get("blockState").asText()).isEqualTo("clear");
        assertThat(rejected.getBody().get("request").isNull()).isTrue();

        ResponseEntity<JsonNode> blocked = block(adminToken, pharmacyId);
        assertThat(blocked.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(blocked.getBody().get("blockState").asText()).isEqualTo("blocked");
        assertThat(block(adminToken, pharmacyId).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        ResponseEntity<JsonNode> unblocked = unblock(adminToken, pharmacyId);
        assertThat(unblocked.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(unblocked.getBody().get("blockState").asText()).isEqualTo("clear");
        assertThat(unblock(adminToken, pharmacyId).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        String openId = blockRequest(salesToken, pharmacyId, "Restrict the counter")
                .getBody()
                .get("request")
                .get("id")
                .asText();
        ResponseEntity<JsonNode> approved = blockDecision(adminToken, pharmacyId, openId, "approve");
        assertThat(approved.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(approved.getBody().get("blockState").asText()).isEqualTo("blocked");

        ResponseEntity<JsonNode> staleRead = rest.exchange(
                "/pharmacy/verification",
                HttpMethod.GET,
                new HttpEntity<>(bearer(ownerToken, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(staleRead.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(staleRead.getBody().get("detail").asText()).isEqualTo("Session was not accepted");

        ResponseEntity<JsonNode> refreshed = rest.exchange(
                "/auth/refresh",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("refreshToken", ownerRefresh), json()),
                JsonNode.class);
        assertThat(refreshed.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(refreshed.getBody().get("account").get("disabled").asBoolean())
                .isTrue();
        ResponseEntity<JsonNode> afterRefresh = rest.exchange(
                "/pharmacy/verification",
                HttpMethod.GET,
                new HttpEntity<>(bearer(token(refreshed.getBody()), MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(afterRefresh.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<JsonNode> pinLogin = rest.exchange(
                "/auth/pin",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111121", "accountType", "pharmacy", "pin", "2468"), json()),
                JsonNode.class);
        assertThat(pinLogin.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(pinLogin.getBody().get("account").get("disabled").asBoolean())
                .isTrue();
        ResponseEntity<byte[]> ownerDocument = rest.exchange(
                "/pharmacies/" + pharmacyId + "/documents/gst",
                HttpMethod.GET,
                new HttpEntity<>(bearer(token(pinLogin.getBody()), MediaType.APPLICATION_JSON)),
                byte[].class);
        assertThat(ownerDocument.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<JsonNode> staffCall = rest.exchange(
                "/probe/permission/users:read",
                HttpMethod.GET,
                new HttpEntity<>(bearer(staffToken, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(staffCall.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(staffCall.getBody().get("detail").asText()).isEqualTo("This pharmacy is restricted.");
        ResponseEntity<JsonNode> staffRefreshResponse = rest.exchange(
                "/auth/refresh",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("refreshToken", staffRefresh), json()),
                JsonNode.class);
        assertThat(staffRefreshResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(staffRefreshResponse.getBody().get("detail").asText()).isEqualTo("This pharmacy is restricted.");
        ResponseEntity<JsonNode> staffSend = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111123", "accountType", "pharmacy", "purpose", "login"), json()),
                JsonNode.class);
        assertThat(staffSend.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(staffSend.getBody().get("mode").asText()).isEqualTo("pin");
        ResponseEntity<JsonNode> staffPin = rest.exchange(
                "/auth/pin",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111123", "accountType", "pharmacy", "pin", "2468"), json()),
                JsonNode.class);
        assertThat(staffPin.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(staffPin.getBody().get("detail").asText()).isEqualTo("This pharmacy is restricted.");

        String blankId = owners(financeToken).getBody().get(1).get("pharmacyId").asText();
        assertThat(block(adminToken, blankId).getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode restrictedLogin = verify("9811111122", "pharmacy", "login");
        assertThat(restrictedLogin.get("account").get("disabled").asBoolean()).isTrue();
        ResponseEntity<JsonNode> restrictedRead = rest.exchange(
                "/pharmacy/verification",
                HttpMethod.GET,
                new HttpEntity<>(bearer(token(restrictedLogin), MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(restrictedRead.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(restrictedRead.getBody().get("detail").asText()).isEqualTo("Session was not accepted");
    }

    @Test
    void anApprovedOwnerCanUpdateProfileWithoutAReviewAndALicenceChangeLocksThePharmacy() {
        String signup = token(verify("9811111130", "pharmacy", "signup"));
        String pharmacyId = submit(signup).get("pharmacyId").asText();
        bootstrap("9811111131");
        String adminToken = token(verify("9811111131", "admin", "login"));
        String complianceToken = tokenForStaff(adminToken, "9811111132", List.of("compliance"));
        decision(complianceToken, pharmacyId, "compliance-decision", "approve", "ok");
        decision(adminToken, pharmacyId, "admin-decision", "approve", "ok");

        JsonNode pinReady = verify("9811111130", "pharmacy", "login");
        rest.exchange(
                "/auth/pin/set",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("pin", "2468"), bearer(token(pinReady), MediaType.APPLICATION_JSON)),
                JsonNode.class);
        JsonNode pinLogin = rest.exchange(
                        "/auth/pin",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                java.util.Map.of("phone", "9811111130", "accountType", "pharmacy", "pin", "2468"),
                                json()),
                        JsonNode.class)
                .getBody();
        String ownerToken = token(pinLogin);
        JsonNode before = ownerApplication(ownerToken).getBody();
        String submittedAt = before.get("submittedAt").asText();
        int mails = mail.messages().size();

        ResponseEntity<JsonNode> saved = postProfile(ownerToken, profile());
        assertThat(saved.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(saved.getBody().get("status").asText()).isEqualTo("approved");
        JsonNode after = ownerApplication(ownerToken).getBody();
        assertThat(after.get("name").asText()).isEqualTo("Care Pharmacy East");
        assertThat(after.get("tagline").asText()).isEqualTo("Open early");
        assertThat(after.get("eInvoicing").asBoolean()).isTrue();
        assertThat(after.get("extraDetails").get(0).get("label").asText()).isEqualTo("Website");
        assertThat(after.get("extraDetails").get(0).get("value").asText()).isEqualTo("care.example");
        assertThat(after.get("invoicePrefix").asText()).isEqualTo("CARE");
        assertThat(after.get("acceptOnlineOrders").asBoolean()).isTrue();
        assertThat(after.get("submittedAt").asText()).isEqualTo(submittedAt);
        assertThat(contentType(after, "gst")).isEqualTo("application/pdf");
        assertThat(mail.messages()).hasSize(mails);
        assertThat(business(ownerToken).getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode renamed = rest.exchange(
                        "/auth/pin",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                java.util.Map.of("phone", "9811111130", "accountType", "pharmacy", "pin", "2468"),
                                json()),
                        JsonNode.class)
                .getBody();
        assertThat(renamed.get("account").get("displayName").asText()).isEqualTo("Care Pharmacy East");

        ResponseEntity<JsonNode> staffCreated = rest.exchange(
                "/pharmacy/staff",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of(
                                "phone",
                                "9811111133",
                                "displayName",
                                "Counter",
                                "pin",
                                "1357",
                                "permissions",
                                List.of("users:read")),
                        bearer(ownerToken, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(staffCreated.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String staffToken = token(rest.exchange(
                        "/auth/pin",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                java.util.Map.of("phone", "9811111133", "accountType", "pharmacy", "pin", "1357"),
                                json()),
                        JsonNode.class)
                .getBody());
        ResponseEntity<JsonNode> staffUpdate = postProfile(staffToken, profile());
        assertThat(staffUpdate.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(staffUpdate.getBody().get("detail").asText())
                .isEqualTo("Only the pharmacy owner can update the profile");

        MultiValueMap<String, Object> review = profile();
        review.set("gstin", "29ABCDE1234F2Z5");
        review.add("panCard", file("application/pdf"));
        ResponseEntity<JsonNode> locked = postProfile(ownerToken, review);
        assertThat(locked.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(locked.getBody().get("status").asText()).isEqualTo("pending_compliance");
        JsonNode pending = ownerApplication(ownerToken).getBody();
        assertThat(pending.get("gstin").asText()).isEqualTo("29ABCDE1234F2Z5");
        assertThat(contentType(pending, "gst")).isEqualTo("application/pdf");
        assertThat(contentType(pending, "pan")).isEqualTo("application/pdf");
        assertThat(pending.get("invoicePrefix").asText()).isEqualTo("CARE");
        assertThat(pending.get("submittedAt").asText()).isNotEqualTo(submittedAt);
        assertThat(mail.messages()).hasSize(mails + 1);
        assertThat(business(ownerToken).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        ResponseEntity<JsonNode> again = postProfile(ownerToken, profile());
        assertThat(again.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(again.getBody().get("detail").asText())
                .isEqualTo("Profile can only be changed while the pharmacy is approved");

        decision(complianceToken, pharmacyId, "compliance-decision", "approve", "ok");
        decision(adminToken, pharmacyId, "admin-decision", "approve", "ok");
        ResponseEntity<JsonNode> mode = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", "9811111130", "accountType", "pharmacy", "purpose", "login"), json()),
                JsonNode.class);
        assertThat(mode.getBody().get("mode").asText()).isEqualTo("pin");
    }

    @Test
    void invoiceSettingsSaveATitleAndASignatureReviewAndProfileLeavesBothUntouched() {
        String signup = token(verify("9811111160", "pharmacy", "signup"));
        String pharmacyId = submit(signup).get("pharmacyId").asText();
        bootstrap("9811111161");
        String adminToken = token(verify("9811111161", "admin", "login"));
        String complianceToken = tokenForStaff(adminToken, "9811111162", List.of("compliance"));
        decision(complianceToken, pharmacyId, "compliance-decision", "approve", "ok");
        decision(adminToken, pharmacyId, "admin-decision", "approve", "ok");
        JsonNode pinReady = verify("9811111160", "pharmacy", "login");
        rest.exchange(
                "/auth/pin/set",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("pin", "9753"), bearer(token(pinReady), MediaType.APPLICATION_JSON)),
                JsonNode.class);
        String ownerToken = token(rest.exchange(
                        "/auth/pin",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                java.util.Map.of("phone", "9811111160", "accountType", "pharmacy", "pin", "9753"),
                                json()),
                        JsonNode.class)
                .getBody());

        ResponseEntity<JsonNode> read = getInvoice(ownerToken);
        assertThat(read.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode settings = read.getBody();
        assertThat(settings.get("template").asText()).isEqualTo("classic");
        assertThat(settings.get("accent").asText()).isEqualTo("#1B3D29");
        assertThat(settings.get("title").asText()).isEqualTo("TAX INVOICE");
        assertThat(settings.get("prefix").asText()).isEqualTo("CARE");
        assertThat(settings.get("signatory").asText()).isEqualTo("Authorised signatory");
        assertThat(settings.get("bankLine").asText()).isEmpty();
        assertThat(settings.get("showBank").asBoolean()).isFalse();
        assertThat(settings.get("terms").asText()).isEqualTo("Goods once sold");
        assertThat(settings.get("showLogo").asBoolean()).isTrue();
        assertThat(settings.get("showStamp").asBoolean()).isFalse();
        assertThat(settings.get("logo").get("contentType").asText()).isEqualTo("image/png");
        assertThat(settings.get("signature").get("contentType").asText()).isEqualTo("image/png");
        assertThat(settings.get("signature").get("url").asText()).contains("/documents/signature");
        assertThat(settings.has("status")).isFalse();
        JsonNode pharmacy = settings.get("pharmacy");
        assertThat(pharmacy.get("name").asText()).isEqualTo("Care Pharmacy");
        assertThat(pharmacy.get("address").asText()).isEqualTo("12 Market Road, Bengaluru, Karnataka, 560001");
        assertThat(pharmacy.get("phone").asText()).isEqualTo("+919811111160");
        assertThat(pharmacy.get("email").asText()).isEqualTo("owner@example.com");
        assertThat(pharmacy.get("gstin").asText()).isEqualTo("29ABCDE1234F1Z5");
        assertThat(pharmacy.get("drugLicenceNo").asText()).isEqualTo("DL-1");
        assertThat(pharmacy.get("pharmacistName").asText()).isEqualTo("Asha Rao, B.Pharm (Reg. No. 12)");

        MultiValueMap<String, Object> ignored = profile();
        ignored.set("terms", "Changed on profile");
        ignored.add("signature", bytes("image/png", new byte[] {9, 9, 9}));
        ResponseEntity<JsonNode> profileSave = postProfile(ownerToken, ignored);
        assertThat(profileSave.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(profileSave.getBody().get("status").asText()).isEqualTo("approved");
        JsonNode afterProfile = ownerApplication(ownerToken).getBody();
        assertThat(afterProfile.get("terms").asText()).isEqualTo("Goods once sold");
        ResponseEntity<byte[]> signature = rest.exchange(
                documentUrl(afterProfile, "signature"),
                HttpMethod.GET,
                new HttpEntity<>(bearer(ownerToken, MediaType.APPLICATION_JSON)),
                byte[].class);
        assertThat(signature.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(signature.getBody()).containsExactly(1, 2, 3, 4);

        int mails = mail.messages().size();
        ResponseEntity<JsonNode> titled = postInvoice(ownerToken, invoice("BILL OF SUPPLY"));
        assertThat(titled.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(titled.getBody().get("title").asText()).isEqualTo("BILL OF SUPPLY");
        assertThat(titled.getBody().get("status").asText()).isEqualTo("approved");
        assertThat(titled.getBody().get("pinSetupRequired").asBoolean()).isFalse();
        assertThat(titled.getBody().has("pharmacy")).isFalse();
        assertThat(mail.messages()).hasSize(mails);
        JsonNode reread = getInvoice(ownerToken).getBody();
        assertThat(reread.get("title").asText()).isEqualTo("BILL OF SUPPLY");
        assertThat(reread.get("pharmacy").get("name").asText()).isEqualTo("Care Pharmacy East");
        assertThat(reread.get("pharmacy").get("gstin").asText()).isEqualTo("29ABCDE1234F1Z5");

        String readerToken = pharmacyStaff(ownerToken, "9811111163", "1357", List.of("invoice-settings:read"));
        assertThat(getInvoice(readerToken).getStatusCode()).isEqualTo(HttpStatus.OK);
        ResponseEntity<JsonNode> readerUpdate = postInvoice(readerToken, invoice("INVOICE"));
        assertThat(readerUpdate.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(readerUpdate.getBody().get("detail").asText()).isEqualTo("Invoice settings cannot be updated");

        String editorToken = pharmacyStaff(ownerToken, "9811111164", "1357", List.of("invoice-settings:update"));
        assertThat(getInvoice(editorToken).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        ResponseEntity<JsonNode> edited = postInvoice(editorToken, invoice("CASH MEMO"));
        assertThat(edited.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(edited.getBody().get("title").asText()).isEqualTo("CASH MEMO");
        assertThat(edited.getBody().get("status").asText()).isEqualTo("approved");

        String blockedToken = pharmacyStaff(ownerToken, "9811111165", "1357", List.of("users:read"));
        ResponseEntity<JsonNode> blocked = getInvoice(blockedToken);
        assertThat(blocked.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(blocked.getBody().get("detail").asText()).isEqualTo("Invoice settings cannot be read");

        MultiValueMap<String, Object> review = invoice("CASH MEMO");
        review.add("signature", bytes("image/png", new byte[] {8}));
        ResponseEntity<JsonNode> locked = postInvoice(ownerToken, review);
        assertThat(locked.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(locked.getBody().get("status").asText()).isEqualTo("pending_compliance");
        assertThat(locked.getBody().get("signature").get("contentType").asText())
                .isEqualTo("image/png");
        assertThat(mail.messages()).hasSize(mails + 1);
        assertThat(getInvoice(ownerToken).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    private String pharmacyStaff(String ownerToken, String phone, String pin, List<String> permissions) {
        ResponseEntity<JsonNode> created = rest.exchange(
                "/pharmacy/staff",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of(
                                "phone", phone, "displayName", "Counter", "pin", pin, "permissions", permissions),
                        bearer(ownerToken, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return token(rest.exchange(
                        "/auth/pin",
                        HttpMethod.POST,
                        new HttpEntity<>(
                                java.util.Map.of("phone", phone, "accountType", "pharmacy", "pin", pin), json()),
                        JsonNode.class)
                .getBody());
    }

    private ResponseEntity<JsonNode> getInvoice(String token) {
        return rest.exchange(
                "/pharmacy/invoice-settings",
                HttpMethod.GET,
                new HttpEntity<>(bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
    }

    private ResponseEntity<JsonNode> postInvoice(String token, MultiValueMap<String, Object> body) {
        return rest.exchange(
                "/pharmacy/invoice-settings",
                HttpMethod.POST,
                new HttpEntity<>(body, bearer(token, MediaType.MULTIPART_FORM_DATA)),
                JsonNode.class);
    }

    private static MultiValueMap<String, Object> invoice(String title) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("template", "classic");
        body.add("accent", "#1B3D29");
        body.add("title", title);
        body.add("prefix", "CARE");
        body.add("signatory", "Authorised signatory");
        body.add("bankLine", "");
        body.add("showBank", "false");
        body.add("terms", "Goods once sold");
        body.add("showLogo", "true");
        body.add("showStamp", "false");
        return body;
    }

    private static String documentUrl(JsonNode application, String slot) {
        for (JsonNode document : application.get("documents")) {
            if (slot.equals(document.get("slot").asText())) {
                return document.get("url").asText();
            }
        }
        return "";
    }

    private static HttpEntity<ByteArrayResource> bytes(String contentType, byte[] body) {
        ByteArrayResource resource = new ByteArrayResource(body) {
            @Override
            public String getFilename() {
                return "upload.bin";
            }
        };
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        return new HttpEntity<>(resource, headers);
    }

    private JsonNode verify(String phone, String type, String purpose) {
        String code = send(phone, type, purpose);
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/otp/verify",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", phone, "accountType", type, "purpose", purpose, "code", code),
                        json()),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private String send(String phone, String type, String purpose) {
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("phone", phone, "accountType", type, "purpose", purpose), json()),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("mode").asText()).isEqualTo("otp");
        String code = sms.latestCode("+91" + phone);
        assertThat(code).isNotBlank();
        return code;
    }

    private JsonNode bootstrap(String phone) {
        HttpHeaders headers = json();
        headers.setBearerAuth("test-bootstrap");
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/admin-bootstrap",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("phone", phone), headers),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private String tokenForStaff(String adminToken, String phone, List<String> subtypes) {
        ResponseEntity<JsonNode> created = rest.exchange(
                "/staff",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", phone, "displayName", "Platform", "subtypes", subtypes),
                        bearer(adminToken, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return token(verify(phone, "staff", "login"));
    }

    private JsonNode submit(String token) {
        ResponseEntity<JsonNode> response = postApplication(token, application());
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private ResponseEntity<JsonNode> postProfile(String token, MultiValueMap<String, Object> body) {
        return rest.exchange(
                "/pharmacy/profile",
                HttpMethod.POST,
                new HttpEntity<>(body, bearer(token, MediaType.MULTIPART_FORM_DATA)),
                JsonNode.class);
    }

    private static MultiValueMap<String, Object> profile() {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("name", "Care Pharmacy East");
        body.add("tagline", "Open early");
        body.add("email", "owner@example.com");
        body.add("address", "12 Market Road");
        body.add("city", "Bengaluru");
        body.add("state", "Karnataka");
        body.add("pincode", "560001");
        body.add("businessTypes", "Retail Pharmacy");
        body.add("industry", "Pharmacy & Healthcare");
        body.add("registrationType", "Proprietorship");
        body.add("gstin", "29ABCDE1234F1Z5");
        body.add("pan", "ABCDE1234F");
        body.add("drugLicenceNo", "DL-1");
        body.add("fssaiNo", "FSSAI-1");
        body.add("tradeLicenceNo", "TL-1");
        body.add("pharmacistName", "Asha Rao, B.Pharm (Reg. No. 12)");
        body.add("terms", "Goods once sold");
        body.add("enableTds", "false");
        body.add("enableTcs", "false");
        body.add("eInvoicing", "true");
        body.add("extraDetails", "[{\"label\":\"Website\",\"value\":\"care.example\"}]");
        return body;
    }

    private ResponseEntity<JsonNode> postApplication(String token, MultiValueMap<String, Object> body) {
        return rest.exchange(
                "/pharmacy/application",
                HttpMethod.POST,
                new HttpEntity<>(body, bearer(token, MediaType.MULTIPART_FORM_DATA)),
                JsonNode.class);
    }

    private ResponseEntity<JsonNode> ownerApplication(String token) {
        return rest.exchange(
                "/pharmacy/application",
                HttpMethod.GET,
                new HttpEntity<>(bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
    }

    private static String contentType(JsonNode application, String slot) {
        for (JsonNode document : application.get("documents")) {
            if (slot.equals(document.get("slot").asText())) {
                return document.get("contentType").asText();
            }
        }
        return "";
    }

    private JsonNode verification(String token) {
        ResponseEntity<JsonNode> response = rest.exchange(
                "/pharmacy/verification",
                HttpMethod.GET,
                new HttpEntity<>(bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private ResponseEntity<JsonNode> business(String token) {
        return rest.exchange(
                "/probe/business",
                HttpMethod.GET,
                new HttpEntity<>(bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
    }

    private ResponseEntity<JsonNode> permission(String token, String key) {
        return rest.exchange(
                "/probe/permission/" + key,
                HttpMethod.GET,
                new HttpEntity<>(bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
    }

    private ResponseEntity<JsonNode> applicationDetail(String token, String pharmacyId) {
        return rest.exchange(
                "/pharmacy-applications/" + pharmacyId,
                HttpMethod.GET,
                new HttpEntity<>(bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
    }

    private ResponseEntity<JsonNode> decision(
            String token, String pharmacyId, String step, String decision, String comment) {
        return rest.exchange(
                "/pharmacy-applications/" + pharmacyId + "/" + step,
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("decision", decision, "comment", comment),
                        bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
    }

    private ResponseEntity<JsonNode> postVerify(String phone, String type, String purpose) {
        String code = send(phone, type, purpose);
        return rest.exchange(
                "/auth/otp/verify",
                HttpMethod.POST,
                new HttpEntity<>(
                        java.util.Map.of("phone", phone, "accountType", type, "purpose", purpose, "code", code),
                        json()),
                JsonNode.class);
    }

    private ResponseEntity<JsonNode> owners(String token) {
        return rest.exchange(
                "/pharmacy-owners",
                HttpMethod.GET,
                new HttpEntity<>(bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
    }

    private ResponseEntity<JsonNode> blockRequest(String token, String pharmacyId, String reason) {
        return rest.exchange(
                "/pharmacy-owners/" + pharmacyId + "/block-requests",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("reason", reason), bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
    }

    private ResponseEntity<JsonNode> blockDecision(String token, String pharmacyId, String requestId, String decision) {
        return rest.exchange(
                "/pharmacy-owners/" + pharmacyId + "/block-requests/" + requestId + "/decision",
                HttpMethod.POST,
                new HttpEntity<>(java.util.Map.of("decision", decision), bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
    }

    private ResponseEntity<JsonNode> block(String token, String pharmacyId) {
        return rest.exchange(
                "/pharmacy-owners/" + pharmacyId + "/block",
                HttpMethod.POST,
                new HttpEntity<>(bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
    }

    private ResponseEntity<JsonNode> unblock(String token, String pharmacyId) {
        return rest.exchange(
                "/pharmacy-owners/" + pharmacyId + "/unblock",
                HttpMethod.POST,
                new HttpEntity<>(bearer(token, MediaType.APPLICATION_JSON)),
                JsonNode.class);
    }

    private static String token(JsonNode session) {
        return session.get("accessToken").asText();
    }

    private static HttpHeaders bearer(String token, MediaType contentType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(contentType);
        return headers;
    }

    private static HttpHeaders json() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private static MultiValueMap<String, Object> application() {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("pharmacyType", "pharmacy");
        body.add("name", "Care Pharmacy");
        body.add("tagline", "Open late");
        body.add("email", "owner@example.com");
        body.add("address", "12 Market Road");
        body.add("city", "Bengaluru");
        body.add("state", "Karnataka");
        body.add("pincode", "560001");
        body.add("businessTypes", "Retail Pharmacy");
        body.add("industry", "Pharmacy & Healthcare");
        body.add("registrationType", "Proprietorship");
        body.add("gstin", "29ABCDE1234F1Z5");
        body.add("pan", "ABCDE1234F");
        body.add("drugLicenceNo", "DL-1");
        body.add("fssaiNo", "FSSAI-1");
        body.add("tradeLicenceNo", "TL-1");
        body.add("pharmacistName", "Asha Rao, B.Pharm (Reg. No. 12)");
        body.add("invoicePrefix", "CARE");
        body.add("terms", "Goods once sold");
        body.add("acceptOnlineOrders", "true");
        body.add("looseSelling", "true");
        body.add("gstCertificate", file("application/pdf"));
        body.add("panCard", file("image/png"));
        body.add("drugLicence", file("image/png"));
        body.add("fssaiLicence", file("image/png"));
        body.add("tradeLicence", file("image/png"));
        body.add("pharmacistCertificate", file("application/pdf"));
        body.add("signature", file("image/png"));
        body.add("logo", file("image/png"));
        return body;
    }

    private static HttpEntity<ByteArrayResource> file(String contentType) {
        ByteArrayResource resource = new ByteArrayResource(new byte[] {1, 2, 3, 4}) {
            @Override
            public String getFilename() {
                return "upload.bin";
            }
        };
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        return new HttpEntity<>(resource, headers);
    }

    @RestController
    @TestConfiguration
    static class Probe {

        @GetMapping("/probe/business")
        java.util.Map<String, Boolean> business() {
            return java.util.Map.of("ok", true);
        }

        @GetMapping("/probe/permission/{key}")
        java.util.Map<String, Boolean> permission(
                @PathVariable String key, org.springframework.security.core.Authentication authentication) {
            var account = Current.require(authentication);
            boolean allowed = Access.pharmacy(
                    account.accountType(),
                    account.disabled(),
                    account.pharmacyRole(),
                    account.pharmacyId(),
                    account.pharmacyId(),
                    account.verificationStatus(),
                    account.permissions(),
                    key);
            if (!allowed) {
                throw new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", "Permission is missing");
            }
            return java.util.Map.of("ok", true);
        }
    }
}
