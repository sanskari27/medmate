package com.medmate.server.distributors.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.distributors.store.DistributorStore;
import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.shared.error.ApiExceptionHandler;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class DistributorControllerTest {

    private static final UUID PHARMACY = UUID.fromString("00000000-0000-4000-8000-000000000010");

    private final DistributorStore store = Mockito.mock(DistributorStore.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(
                    new DistributorController(new DistributorService(store)))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @BeforeEach
    void store() {
        when(store.lockPharmacy(PHARMACY)).thenReturn(true);
        when(store.find(eq(PHARMACY), eq("DST-001"))).thenReturn(Optional.of(activeRow()));
        when(store.transactions(PHARMACY)).thenReturn(List.of());
    }

    @Test
    void theDirectoryOmitsTheLedger() throws Exception {
        mvc.perform(get("/pharmacy/distributors").principal(staff("distributors:read")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.distributors").isArray())
                .andExpect(jsonPath("$.distributors[0].transactions").doesNotExist());
    }

    @Test
    void paymentsAreAPage() throws Exception {
        when(store.paymentCount(eq(PHARMACY), eq("DST-001"), nullable(LocalDate.class), nullable(LocalDate.class)))
                .thenReturn(3);
        when(store.ledgerSums(eq(PHARMACY), eq("DST-001"), nullable(LocalDate.class), nullable(LocalDate.class)))
                .thenReturn(new DistributorStore.LedgerSums(0, 0, 0));
        mvc.perform(get("/pharmacy/distributors/DST-001/payments").principal(staff("distributors:read")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payments").isArray())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(25))
                .andExpect(jsonPath("$.total").value(3));
    }

    @Test
    void aStatementContainsThePurchaseTotal() throws Exception {
        when(store.payments(
                        eq(PHARMACY),
                        eq("DST-001"),
                        nullable(LocalDate.class),
                        nullable(LocalDate.class),
                        anyInt(),
                        anyInt()))
                .thenReturn(List.of(new DistributorStore.TransactionRow(
                        "TXN-007",
                        "DST-001",
                        "purchase",
                        935923,
                        "PUR-004",
                        "H00-00",
                        null,
                        Instant.parse("2025-05-13T04:30:00Z"))));
        when(store.paymentCount(eq(PHARMACY), eq("DST-001"), nullable(LocalDate.class), nullable(LocalDate.class)))
                .thenReturn(1);
        when(store.ledgerSums(eq(PHARMACY), eq("DST-001"), nullable(LocalDate.class), nullable(LocalDate.class)))
                .thenReturn(new DistributorStore.LedgerSums(935923, 0, 0));
        mvc.perform(get("/pharmacy/distributors/DST-001/payments")
                        .param("from", "2025-05-01")
                        .param("to", "2025-05-31")
                        .principal(staff("distributors:read")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payments[0].type").value("purchase"))
                .andExpect(jsonPath("$.payments[0].reference").value("PUR-004"))
                .andExpect(jsonPath("$.purchaseTotal").value(935923))
                .andExpect(jsonPath("$.paymentTotal").value(0))
                .andExpect(jsonPath("$.returnTotal").value(0));
    }

    @Test
    void aBadPaymentPageIsRejected() throws Exception {
        mvc.perform(get("/pharmacy/distributors/DST-001/payments")
                        .param("size", "101")
                        .principal(staff("distributors:read")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Page is not valid"));
    }

    @Test
    void readIsRequiredToList() throws Exception {
        mvc.perform(get("/pharmacy/distributors").principal(staff("distributors:pay")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Distributors cannot be read"));
        verify(store, never()).list(any());
    }

    @Test
    void createIsRequiredToAdd() throws Exception {
        mvc.perform(post("/pharmacy/distributors")
                        .principal(staff("distributors:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Apollo Wholesale\",\"phone\":\"9886012222\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Distributors cannot be created"));
        verify(store, never()).insert(any(), anyString(), any());
    }

    @Test
    void updateIsRequiredToEdit() throws Exception {
        mvc.perform(patch("/pharmacy/distributors/DST-001")
                        .principal(staff("distributors:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"city\":\"Mysuru\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Distributors cannot be updated"));
        verify(store, never()).update(any(), anyString(), any());
    }

    @Test
    void deleteIsRequiredToSetInactive() throws Exception {
        mvc.perform(patch("/pharmacy/distributors/DST-001")
                        .principal(staff("distributors:update"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Distributors cannot be set inactive"));
        verify(store, never()).update(any(), anyString(), any());
    }

    @Test
    void payIsRequiredToRecordAPayment() throws Exception {
        mvc.perform(post("/pharmacy/distributors/DST-001/payments")
                        .principal(staff("distributors:update"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"amount\":100,\"mode\":\"cash\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Distributors cannot be paid"));
        verify(store, never())
                .insertTransaction(any(), any(), any(), any(), any(int.class), any(), any(), any(), any());
    }

    private static DistributorStore.DistributorRow activeRow() {
        return new DistributorStore.DistributorRow(
                "DST-001",
                "Bengaluru Pharma",
                null,
                "9886011111",
                null,
                null,
                null,
                null,
                "Bengaluru",
                "Karnataka",
                "30 days credit",
                10000,
                true,
                true);
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
                true,
                null);
        return new AccountAuthentication(principal);
    }
}
