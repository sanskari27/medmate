package com.medmate.server.billing.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.billing.store.BillStore;
import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.shared.error.ApiExceptionHandler;
import com.medmate.server.stock.CounterStock;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SaleControllerTest {

    private static final UUID PHARMACY = UUID.fromString("00000000-0000-4000-8000-000000000010");

    private final BillStore store = Mockito.mock(BillStore.class);
    private final CounterStock stock = Mockito.mock(CounterStock.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new SaleController(new SaleService(store, stock)))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void returnAloneCannotList() throws Exception {
        mvc.perform(get("/pharmacy/sales").principal(staff("sales:return")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Sales cannot be read"));
        verify(store, never()).bills(PHARMACY);
    }

    @Test
    void readCannotReturn() throws Exception {
        mvc.perform(post("/pharmacy/sales/INV-0001/returns")
                        .principal(staff("sales:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lines\":[{\"position\":0,\"qty\":1}]}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Sales cannot be returned"));
        verify(stock, never()).lockPharmacy(PHARMACY);
    }

    @Test
    void returnReachesThePharmacy() throws Exception {
        when(stock.lockPharmacy(PHARMACY)).thenReturn(false);
        mvc.perform(post("/pharmacy/sales/INV-0001/returns")
                        .principal(staff("sales:return"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lines\":[{\"position\":0,\"qty\":1}]}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Pharmacy was not found"));
        verify(store, never()).bill(PHARMACY, "INV-0001", true);
    }

    @Test
    void aBadPageIsRejected() throws Exception {
        mvc.perform(get("/pharmacy/sales").param("size", "101").principal(staff("sales:read")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Page is not valid"));
        verify(store, never())
                .salePage(
                        any(),
                        anyString(),
                        anyString(),
                        nullable(LocalDate.class),
                        nullable(LocalDate.class),
                        anyInt(),
                        anyInt());
    }

    @Test
    void theListKeepsWholeMonthStatsBesideThePage() throws Exception {
        when(store.salePage(
                        any(),
                        anyString(),
                        anyString(),
                        nullable(LocalDate.class),
                        nullable(LocalDate.class),
                        anyInt(),
                        anyInt()))
                .thenReturn(new BillStore.SalePage(List.of(), 30));
        when(store.saleMonth(any(), any(), any()))
                .thenReturn(new BillStore.SaleMonth(new BigDecimal("10.00"), 1, BigDecimal.ZERO, 0));
        mvc.perform(get("/pharmacy/sales").param("page", "2").principal(staff("sales:read")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(2))
                .andExpect(jsonPath("$.size").value(25))
                .andExpect(jsonPath("$.total").value(30))
                .andExpect(jsonPath("$.stats.saleCount").value(1));
    }

    @Test
    void aDateWindowAndSaleTypeReachTheStore() throws Exception {
        when(store.salePage(
                        any(),
                        anyString(),
                        anyString(),
                        nullable(LocalDate.class),
                        nullable(LocalDate.class),
                        anyInt(),
                        anyInt()))
                .thenReturn(new BillStore.SalePage(List.of(), 0));
        when(store.saleMonth(any(), any(), any()))
                .thenReturn(new BillStore.SaleMonth(BigDecimal.ZERO, 0, BigDecimal.ZERO, 0));
        mvc.perform(get("/pharmacy/sales")
                        .param("from", "2025-05-13")
                        .param("to", "2025-05-13")
                        .param("type", "sale")
                        .param("q", "BATCH001")
                        .principal(staff("sales:read")))
                .andExpect(status().isOk());
        verify(store)
                .salePage(
                        eq(PHARMACY),
                        eq("%batch001%"),
                        eq("sale"),
                        eq(LocalDate.parse("2025-05-13")),
                        eq(LocalDate.parse("2025-05-13")),
                        eq(25),
                        eq(0));
    }

    @Test
    void aReversedDateRangeIsRejected() throws Exception {
        mvc.perform(get("/pharmacy/sales")
                        .param("from", "2026-01-02")
                        .param("to", "2026-01-01")
                        .principal(staff("sales:read")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("The date range is not valid."));
        verify(store, never())
                .salePage(
                        any(),
                        anyString(),
                        anyString(),
                        nullable(LocalDate.class),
                        nullable(LocalDate.class),
                        anyInt(),
                        anyInt());
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
