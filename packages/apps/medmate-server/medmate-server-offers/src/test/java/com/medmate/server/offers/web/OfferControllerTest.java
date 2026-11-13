package com.medmate.server.offers.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.offers.store.OfferStore;
import com.medmate.server.shared.error.ApiExceptionHandler;
import com.medmate.server.stock.InventoryNames;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class OfferControllerTest {

    private static final UUID PHARMACY = UUID.fromString("00000000-0000-4000-8000-000000000010");

    private final OfferStore store = Mockito.mock(OfferStore.class);
    private final InventoryNames names = Mockito.mock(InventoryNames.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new OfferController(new OfferService(store, names)))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void theListDoesNotEmbedProducts() throws Exception {
        when(store.list(any())).thenReturn(List.of());
        when(names.list(any())).thenReturn(List.of());
        mvc.perform(get("/pharmacy/offers").principal(staff("offers:read")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.offers").isArray())
                .andExpect(jsonPath("$.products").doesNotExist());
    }

    @Test
    void readIsRequiredToList() throws Exception {
        mvc.perform(get("/pharmacy/offers").principal(staff("offers:create")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Offers cannot be read"));
        verify(store, never()).list(any());
    }

    @Test
    void createIsRequiredToAdd() throws Exception {
        mvc.perform(
                        post("/pharmacy/offers")
                                .principal(staff("offers:read"))
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        "{\"title\":\"Monsoon Health Sale\",\"code\":\"NAMMA25\",\"type\":\"pct\",\"value\":10,\"scope\":\"all\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Offers cannot be created"));
        verify(store, never()).insert(any(), any(), any(), any());
    }

    @Test
    void updateIsRequiredToEdit() throws Exception {
        mvc.perform(patch("/pharmacy/offers/OFR-001")
                        .principal(staff("offers:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Offers cannot be updated"));
        verify(store, never()).update(any(), any(), any());
    }

    @Test
    void deleteIsRequiredToRemove() throws Exception {
        mvc.perform(delete("/pharmacy/offers/OFR-001").principal(staff("offers:update")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Offers cannot be deleted"));
        verify(store, never()).delete(any(), any());
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
