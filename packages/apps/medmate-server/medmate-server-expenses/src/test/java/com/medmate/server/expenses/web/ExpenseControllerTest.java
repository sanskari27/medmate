package com.medmate.server.expenses.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.expenses.store.ExpenseStore;
import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.shared.error.ApiExceptionHandler;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ExpenseControllerTest {

    private static final UUID PHARMACY = UUID.fromString("00000000-0000-4000-8000-000000000010");
    private static final String EXPENSE =
            """
            {"spentOn":"2026-11-13","party":"Landlord","category":"Rent Expense","paymentMode":"cash","amount":"118.00","gst":18}
            """;

    private final ExpenseStore store = Mockito.mock(ExpenseStore.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new ExpenseController(
                    new ExpenseService(store, Clock.fixed(Instant.parse("2026-11-13T08:00:00Z"), ZoneOffset.UTC))))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void readCanListAndExportAndCannotCreate() throws Exception {
        mvc.perform(get("/pharmacy/expenses").principal(staff("expenses:read")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expenses").isEmpty())
                .andExpect(jsonPath("$.summary.count").value(0))
                .andExpect(jsonPath("$.categories.length()").value(11));
        mvc.perform(get("/pharmacy/expenses/export").principal(staff("expenses:read")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.expenses").isEmpty());
        mvc.perform(post("/pharmacy/expenses")
                        .principal(staff("expenses:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EXPENSE))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Expenses cannot be created"));
        verify(store, never()).insert(eq(PHARMACY), eq(1), any());
    }

    @Test
    void createCanSaveAndCannotList() throws Exception {
        when(store.lockPharmacy(PHARMACY)).thenReturn(true);
        when(store.nextSeq(PHARMACY)).thenReturn(1);
        mvc.perform(get("/pharmacy/expenses").principal(staff("expenses:create")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Expenses cannot be read"));
        mvc.perform(get("/pharmacy/expenses/export").principal(staff("expenses:create")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Expenses cannot be read"));
        mvc.perform(post("/pharmacy/expenses")
                        .principal(staff("expenses:create"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(EXPENSE))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.expense.number").value("EXP-1001"))
                .andExpect(jsonPath("$.expense.amount").value("118.00"));
        verify(store).insert(eq(PHARMACY), eq(1), any());
        verify(store, never()).count(eq(PHARMACY), any());
    }

    private static AccountAuthentication staff(String... keys) {
        AccountPrincipal principal = new AccountPrincipal(
                UUID.randomUUID(),
                "919800000000",
                AccountType.PHARMACY,
                "Ada",
                false,
                PHARMACY,
                PharmacyRole.STAFF,
                VerificationStatus.APPROVED,
                null,
                null,
                Set.of(),
                Set.of(keys),
                true);
        return new AccountAuthentication(principal);
    }
}
