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
                                "permissions",
                                List.of("inventory:read")),
                        bearer(refreshedOwner, MediaType.APPLICATION_JSON)),
                JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        String staffToken = token(verify("9811111108", "pharmacy", "login"));
        assertThat(permission(staffToken, "inventory:read").getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(permission(staffToken, "billing:create").getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(business(refreshedOwner).getStatusCode()).isEqualTo(HttpStatus.OK);
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
        ResponseEntity<JsonNode> response = rest.exchange(
                "/pharmacy/application",
                HttpMethod.POST,
                new HttpEntity<>(application(), bearer(token, MediaType.MULTIPART_FORM_DATA)),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
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
