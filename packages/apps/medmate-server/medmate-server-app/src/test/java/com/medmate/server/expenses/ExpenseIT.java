package com.medmate.server.expenses;

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
// Each IT keeps a pool on the shared database. Release this one before the later classes.
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ExpenseIT {

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
    void expensesAreNumberedScopedAndPermissioned() {
        String today = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        JsonNode ownerSession = verify("9822001801", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        approve(ownerSession.get("account").get("pharmacyId").asText());

        JsonNode created = created(owner, today, "Landlord", "Rent Expense", "118.00", 18);
        assertThat(created.get("expense").get("number").asText()).isEqualTo("EXP-1001");
        assertThat(created.get("expense").get("amount").asText()).isEqualTo("118.00");
        assertThat(created.get("expense").get("gst").asInt()).isEqualTo(18);

        JsonNode list = get("/pharmacy/expenses", owner);
        assertThat(list.get("summary").get("gst").asText()).isEqualTo("18.00");
        assertThat(list.get("expenses")).hasSize(1);

        ResponseEntity<JsonNode> future = exchange(
                "/pharmacy/expenses",
                owner,
                expense(LocalDate.now(ZoneId.of("Asia/Kolkata")).plusDays(1).toString(), "Later", "Rent Expense"),
                HttpMethod.POST);
        assertThat(future.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(future.getBody().get("detail").asText()).isEqualTo("Expense is not valid");
        assertThat(get("/pharmacy/expenses", owner).get("total").asInt()).isEqualTo(1);

        String reader = staff(owner, "9822001802", List.of("expenses:read"));
        assertThat(get("/pharmacy/expenses/export", reader).get("expenses")).hasSize(1);
        ResponseEntity<JsonNode> denied = exchange("/pharmacy/expenses", reader, ownerBody(today), HttpMethod.POST);
        assertThat(denied.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(denied.getBody().get("detail").asText()).isEqualTo("Expenses cannot be created");

        String creator = staff(owner, "9822001803", List.of("expenses:create"));
        ResponseEntity<JsonNode> hidden =
                rest.exchange("/pharmacy/expenses", HttpMethod.GET, new HttpEntity<>(bearer(creator)), JsonNode.class);
        assertThat(hidden.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(hidden.getBody().get("detail").asText()).isEqualTo("Expenses cannot be read");
        JsonNode second = created(creator, today, "Canteen", "Tea", "50.00", 0);
        assertThat(second.get("expense").get("number").asText()).isEqualTo("EXP-1002");

        JsonNode otherSession = verify("9822001804", "pharmacy", "signup", false);
        String other = token(otherSession);
        approve(otherSession.get("account").get("pharmacyId").asText());
        JsonNode isolated = created(other, today, "Power", "Electricity Bill", "10.00", 0);
        assertThat(isolated.get("expense").get("number").asText()).isEqualTo("EXP-1001");
        assertThat(get("/pharmacy/expenses", other).get("expenses")).hasSize(1);
        assertThat(get("/pharmacy/expenses", owner).get("total").asInt()).isEqualTo(2);
    }

    @Test
    void pagesKeepTheFilteredSummaryAndExportBothPages() {
        String today = LocalDate.now(ZoneId.of("Asia/Kolkata")).toString();
        JsonNode ownerSession = verify("9822001811", "pharmacy", "signup", false);
        String owner = token(ownerSession);
        approve(ownerSession.get("account").get("pharmacyId").asText());
        for (int index = 1; index <= 30; index++) {
            String category = index == 30 ? "Canteen" : "Rent Expense";
            created(owner, today, "Party " + index, category, "10.00", 0);
        }

        JsonNode first = get("/pharmacy/expenses?page=1&size=25", owner);
        assertThat(first.get("expenses")).hasSize(25);
        assertThat(first.get("total").asInt()).isEqualTo(30);
        assertThat(first.get("summary").get("count").asInt()).isEqualTo(30);
        assertThat(first.get("expenses").get(0).get("number").asText()).isEqualTo("EXP-1030");

        JsonNode second = get("/pharmacy/expenses?page=2&size=25", owner);
        assertThat(second.get("expenses")).hasSize(5);
        assertThat(second.get("summary").get("count").asInt()).isEqualTo(30);
        assertThat(second.get("expenses").get(4).get("number").asText()).isEqualTo("EXP-1001");

        JsonNode canteen = get("/pharmacy/expenses?category=Canteen", owner);
        assertThat(canteen.get("summary").get("count").asInt()).isEqualTo(1);
        assertThat(canteen.get("total").asInt()).isEqualTo(1);
        assertThat(canteen.get("categories").size()).isEqualTo(12);
        assertThat(canteen.get("categories").get(11).asText()).isEqualTo("Canteen");

        JsonNode search = get("/pharmacy/expenses?q=Canteen", owner);
        assertThat(search.get("summary").get("count").asInt()).isEqualTo(1);
        assertThat(search.get("categories").size()).isEqualTo(12);

        assertThat(get("/pharmacy/expenses/export", owner).get("expenses")).hasSize(30);

        ResponseEntity<JsonNode> size = rest.exchange(
                "/pharmacy/expenses?size=101", HttpMethod.GET, new HttpEntity<>(bearer(owner)), JsonNode.class);
        assertThat(size.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(size.getBody().get("detail").asText()).isEqualTo("Page is not valid");

        ResponseEntity<JsonNode> reversed = rest.exchange(
                "/pharmacy/expenses?from=2026-11-13&to=2026-11-01",
                HttpMethod.GET,
                new HttpEntity<>(bearer(owner)),
                JsonNode.class);
        assertThat(reversed.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(reversed.getBody().get("detail").asText()).isEqualTo("Date range is not valid");
    }

    private JsonNode created(String token, String spentOn, String party, String category, String amount, int gst) {
        ResponseEntity<JsonNode> response =
                exchange("/pharmacy/expenses", token, body(spentOn, party, category, amount, gst), HttpMethod.POST);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody();
    }

    private Map<String, Object> ownerBody(String spentOn) {
        return body(spentOn, "Nope", "Rent Expense", "10.00", 0);
    }

    private Map<String, Object> expense(String spentOn, String party, String category) {
        return body(spentOn, party, category, "10.00", 0);
    }

    private Map<String, Object> body(String spentOn, String party, String category, String amount, int gst) {
        return Map.of(
                "spentOn",
                spentOn,
                "party",
                party,
                "category",
                category,
                "paymentMode",
                "cash",
                "amount",
                amount,
                "gst",
                gst);
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
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        return headers;
    }

    private static HttpHeaders json() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
