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
import java.util.List;
import java.util.Optional;
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

    @Test
    void readIsRequiredToListRacks() throws Exception {
        mvc.perform(get("/pharmacy/racks").principal(staff("racks:create")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Racks cannot be read"));
        verify(stock, never()).rackCodes(any());
        verify(stock, never()).products(any());
    }

    @Test
    void createIsRequiredToAddARack() throws Exception {
        mvc.perform(post("/pharmacy/racks")
                        .principal(staff("racks:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rack\":\"A1\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Racks cannot be created"));
        verify(stock, never()).insertRack(any(), any());
    }

    @Test
    void updateIsRequiredToPlaceAProduct() throws Exception {
        mvc.perform(patch("/pharmacy/inventory/DR100/location")
                        .principal(staff("racks:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rack\":\"A1\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Racks cannot be updated"));
        mvc.perform(post("/pharmacy/inventory/location/bulk")
                        .principal(staff("racks:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ids\":[\"DR100\"],\"rack\":\"A1\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Racks cannot be updated"));
        verify(stock, never()).updateLocation(any(), any(), any(), any());
    }

    @Test
    void blankAndDuplicateRacksAreRefused() throws Exception {
        mvc.perform(post("/pharmacy/racks")
                        .principal(staff("racks:create"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rack\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Rack code is required"));

        Mockito.when(stock.rackCodes(PHARMACY)).thenReturn(List.of("A3-12"));
        mvc.perform(post("/pharmacy/racks")
                        .principal(staff("racks:create"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rack\":\"a3-12\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("That rack already exists"));
        verify(stock, never()).insertRack(any(), any());
    }

    @Test
    void placingAProductKeepsTheSecondSlot() throws Exception {
        StockStore.ProductRow current = product(null, "C2");
        StockStore.ProductRow saved = product("A1", "C2");
        Mockito.when(stock.product(PHARMACY, "DR100")).thenReturn(Optional.of(current), Optional.of(saved));
        Mockito.when(stock.updateLocation(PHARMACY, "DR100", "A1", "C2")).thenReturn(1);
        Mockito.when(stock.batches(PHARMACY)).thenReturn(List.of());

        mvc.perform(patch("/pharmacy/inventory/DR100/location")
                        .principal(staff("racks:update"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rack\":\"a1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.product.rack").value("A1"))
                .andExpect(jsonPath("$.product.rackAlt").value("C2"));
    }

    private static StockStore.ProductRow product(String rack, String rackAlt) {
        return new StockStore.ProductRow("DR100", "Crocin", null, null, null, null, null, 20, rack, rackAlt);
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
