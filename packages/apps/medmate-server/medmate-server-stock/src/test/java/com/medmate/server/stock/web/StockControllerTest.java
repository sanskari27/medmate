package com.medmate.server.stock.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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
import com.medmate.server.stock.MedicineCatalog;
import com.medmate.server.stock.store.StockStore;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class StockControllerTest {

    private static final UUID PHARMACY = UUID.fromString("00000000-0000-4000-8000-000000000010");

    private final StockStore stock = Mockito.mock(StockStore.class);
    private final DistributorStore distributors = Mockito.mock(DistributorStore.class);
    private final MedicineCatalog catalog = Mockito.mock(MedicineCatalog.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(
                    new StockController(new StockService(stock, distributors, catalog)))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void readIsRequiredToListPurchases() throws Exception {
        mvc.perform(get("/pharmacy/purchases").principal(staff("purchases:create")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Purchases cannot be read"));
        verify(stock, never()).purchases(any());
    }

    @Test
    void createIsRequiredToSaveABill() throws Exception {
        mvc.perform(post("/pharmacy/purchases")
                        .principal(staff("purchases:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"distributorId\":\"DST-001\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Purchases cannot be created"));
        verify(stock, never()).insertPurchase(any(), any(), any(), any(), any(), any(), any(int.class));
    }

    @Test
    void returnIsRequiredToSendStockBack() throws Exception {
        mvc.perform(post("/pharmacy/purchases/PUR-001/returns")
                        .principal(staff("purchases:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lines\":[]}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Purchases cannot be returned"));
        verify(stock, never()).insertReturn(any(), any(), any(), any(), any(int.class));
    }

    @Test
    void readIsRequiredToListInventory() throws Exception {
        mvc.perform(get("/pharmacy/inventory").principal(staff("inventory:update")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Inventory cannot be read"));
        verify(stock, never()).products(any());
    }

    @Test
    void updateIsRequiredToChangeReorder() throws Exception {
        mvc.perform(patch("/pharmacy/inventory/DR100")
                        .principal(staff("inventory:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reorderLevel\":8}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Inventory cannot be updated"));
        verify(stock, never()).updateReorder(any(), any(), any(int.class));
    }

    @Test
    void createIsRequiredToSearchAndValidate() throws Exception {
        mvc.perform(get("/pharmacy/medicines/search")
                        .principal(staff("purchases:read"))
                        .param("q", "crocin"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Purchases cannot be created"));
        mvc.perform(post("/pharmacy/medicines/validate")
                        .principal(staff("purchases:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ids\":[\"DR100\"]}"))
                .andExpect(status().isForbidden());
        verify(catalog, never()).search(any(), any(int.class));
        verify(catalog, never()).lookup(any());
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
