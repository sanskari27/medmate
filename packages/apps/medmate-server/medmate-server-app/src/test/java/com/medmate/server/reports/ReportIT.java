package com.medmate.server.reports;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.billing.BillDatabase;
import com.medmate.server.identity.sms.RecordingSmsSender;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("identity-it")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ReportIT {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        BillDatabase.register(registry);
    }

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private RecordingSmsSender sms;

    @Autowired
    private DataSource dataSource;

    @BeforeEach
    void reset() throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("TRUNCATE account, otp_challenge CASCADE");
        }
        sms.clear();
    }

    @Test
    void postedBillsPurchasesAndExpensesBecomeReports() throws SQLException {
        JsonNode ownerSession = verify("9822001901", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        String pharmacyId = ownerSession.get("account").get("pharmacyId").asText();
        approve(pharmacyId);
        stock(pharmacyId);
        exchange(
                "/pharmacy/distributors",
                owner,
                Map.of("name", "Bengaluru Pharma", "phone", "9886011111"),
                HttpMethod.POST);
        String today = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        ResponseEntity<JsonNode> purchase = exchange(
                "/pharmacy/purchases",
                owner,
                Map.of(
                        "distributorId",
                        "DST-001",
                        "invoiceNo",
                        "INV-1",
                        "invoiceDate",
                        today,
                        "lines",
                        List.of(Map.of(
                                "productId",
                                "DR100",
                                "batchNo",
                                "B9",
                                "expiry",
                                "2027-06",
                                "qty",
                                1,
                                "freeQty",
                                0,
                                "rate",
                                10,
                                "mrp",
                                18,
                                "gst",
                                0))),
                HttpMethod.POST);
        assertThat(purchase.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        ResponseEntity<JsonNode> expense = exchange(
                "/pharmacy/expenses",
                owner,
                Map.of(
                        "spentOn",
                        today,
                        "party",
                        "Landlord",
                        "category",
                        "Rent Expense",
                        "paymentMode",
                        "cash",
                        "amount",
                        "10.00",
                        "gst",
                        0),
                HttpMethod.POST);
        assertThat(expense.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        JsonNode cash = created(owner, sale("Ada", "9886012345", "cash"));
        JsonNode credit = created(owner, sale("Beena", "9886012222", "credit"));
        assertThat(cash.get("payable").asText()).isEqualTo("30.00");
        assertThat(credit.get("payable").asText()).isEqualTo("30.00");
        ResponseEntity<JsonNode> repaid = exchange(
                "/pharmacy/patients/9886012222/repayments",
                owner,
                Map.of("amount", 10, "mode", "upi"),
                HttpMethod.POST);
        assertThat(repaid.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        JsonNode gstr = get("/pharmacy/reports/gstr1", owner);
        assertThat(gstr.get("rows").get(0).get(0).asText()).isEqualTo("12%");
        assertThat(gstr.get("rows").get(0).get(1).asInt()).isEqualTo(2);
        assertThat(gstr.get("rows").get(0).get(6).asText()).isEqualTo("60.00");
        JsonNode dues = get("/pharmacy/reports/party-outstanding", owner);
        assertThat(dues.get("label").asText()).isEqualTo("As of today");
        assertThat(dues.get("rows")).hasSize(1);
        assertThat(dues.get("rows").get(0).get(0).asText()).isEqualTo("Beena");
        assertThat(dues.get("rows").get(0).get(2).asText()).isEqualTo("20.00");

        String reader = staff(owner, "9822001902", List.of("reports:read"));
        assertThat(get("/pharmacy/reports/gstr1", reader).get("id").asText()).isEqualTo("gstr1");
        ResponseEntity<String> denied = rest.exchange(
                "/pharmacy/reports/gstr1/export", HttpMethod.GET, new HttpEntity<>(bearer(reader)), String.class);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        ResponseEntity<String> csv = rest.exchange(
                "/pharmacy/reports/gstr1/export", HttpMethod.GET, new HttpEntity<>(bearer(owner)), String.class);
        assertThat(csv.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(csv.getHeaders().getContentType().toString()).contains("text/csv");
        assertThat(csv.getBody()).contains("GST slab").contains("60.00");
    }

    private void stock(String pharmacyId) throws SQLException {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute("UPDATE pharmacy SET invoice_prefix = 'INV-' WHERE id = '" + pharmacyId + "'");
            statement.execute(
                    "INSERT INTO inventory_product (pharmacy_id, product_id, name, composition, reorder_level, prescription_required) VALUES ('"
                            + pharmacyId + "', 'med-a', 'Crocin Advance', 'Paracetamol', 20, false)");
            statement.execute(
                    "INSERT INTO inventory_batch (pharmacy_id, product_id, batch_no, expiry, qty, rate, mrp, gst) VALUES ('"
                            + pharmacyId + "', 'med-a', 'B1', '2027-06', 8, 10.00, 30.00, 12)");
        }
    }

    private Map<String, Object> sale(String name, String phone, String payMode) {
        return Map.of(
                "patientName",
                name,
                "patientPhone",
                phone,
                "payMode",
                payMode,
                "lines",
                List.of(Map.of("productId", "med-a", "batchNo", "B1", "qty", 1)));
    }

    private JsonNode created(String token, Map<String, Object> body) {
        ResponseEntity<JsonNode> response = exchange("/pharmacy/bills", token, body, HttpMethod.POST);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody().get("bill");
    }

    private String staff(String owner, String phone, List<String> permissions) {
        ResponseEntity<JsonNode> created = rest.exchange(
                "/pharmacy/staff",
                HttpMethod.POST,
                new HttpEntity<>(
                        Map.of("phone", phone, "displayName", "Counter", "pin", "1357", "permissions", permissions),
                        bearer(owner)),
                JsonNode.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        ResponseEntity<JsonNode> pin = rest.exchange(
                "/auth/pin",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("phone", phone, "accountType", "pharmacy", "pin", "1357"), json()),
                JsonNode.class);
        assertThat(pin.getStatusCode()).isEqualTo(HttpStatus.OK);
        return token(pin.getBody());
    }

    private void approve(String pharmacyId) {
        try (Connection connection = dataSource.getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute(
                    "UPDATE pharmacy SET verification_status = 'approved', name = 'Sri Sai Medicals' WHERE id = '"
                            + pharmacyId + "'");
        } catch (SQLException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private JsonNode get(String path, String token) {
        ResponseEntity<JsonNode> response =
                rest.exchange(path, HttpMethod.GET, new HttpEntity<>(bearer(token)), JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private ResponseEntity<JsonNode> exchange(String path, String token, Map<String, Object> body, HttpMethod method) {
        HttpHeaders headers = bearer(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.exchange(path, method, new HttpEntity<>(body, headers), JsonNode.class);
    }

    private JsonNode verify(String phone, String type, String purpose, boolean bootstrap) {
        String code = send(phone, type, purpose);
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/otp/verify",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("phone", phone, "accountType", type, "purpose", purpose, "code", code), json()),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        return response.getBody();
    }

    private String send(String phone, String type, String purpose) {
        ResponseEntity<JsonNode> response = rest.exchange(
                "/auth/otp/send",
                HttpMethod.POST,
                new HttpEntity<>(Map.of("phone", phone, "accountType", type, "purpose", purpose), json()),
                JsonNode.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        String code = sms.latestCode("+91" + phone);
        assertThat(code).isNotBlank();
        return code;
    }

    private static String token(JsonNode session) {
        return session.get("accessToken").asText();
    }

    private static HttpHeaders bearer(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON, MediaType.valueOf("text/csv")));
        return headers;
    }

    private static HttpHeaders json() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
