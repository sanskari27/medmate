package com.medmate.server.catalog.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.catalog.CatalogConflict;
import com.medmate.server.catalog.CatalogDocuments;
import com.medmate.server.catalog.CatalogMissing;
import com.medmate.server.catalog.CatalogStore;
import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.StaffSubtype;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.shared.error.ApiExceptionHandler;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CatalogControllerTest {

    private static final String DRUG =
            """
            {"productId":"DR100","productName":"Crocin","prescriptionRequired":false,"ingredients":[{"name":"Paracetamol","strength":"500 mg"}]}
            """;

    private final CatalogStore store = Mockito.mock(CatalogStore.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new CatalogController(new CatalogService(store)))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void anonymousSearchRejectsAShortQuery() throws Exception {
        when(store.search("crocin", 20)).thenReturn(new CatalogDocuments.SearchResponse(List.of(), List.of()));
        mvc.perform(get("/api/search").param("q", "crocin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.drug").isArray())
                .andExpect(jsonPath("$.fmcg").isArray());

        mvc.perform(get("/api/search").param("q", "a"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Query is not valid"));
        verify(store, never()).search("a", 20);

        when(store.search("crocin", 20))
                .thenReturn(new CatalogDocuments.SearchResponse(
                        List.of(new CatalogDocuments.DrugSummary(
                                "DR100", "Crocin", "Counter Crocin", null, null, null, null, false, null, null, null)),
                        List.of()));
        mvc.perform(get("/api/search").param("q", "crocin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.drug[0].displayName").value("Counter Crocin"));
    }

    @Test
    void theCatalogListIsLimitedToAdminAndSales() throws Exception {
        when(store.list(any()))
                .thenReturn(new CatalogDocuments.CatalogList(
                        new CatalogDocuments.SummaryPage<>(
                                List.of(new CatalogDocuments.DrugSummary(
                                        "DR100",
                                        "Crocin",
                                        "Counter Crocin",
                                        null,
                                        null,
                                        null,
                                        null,
                                        false,
                                        null,
                                        null,
                                        null)),
                                1,
                                25,
                                1),
                        new CatalogDocuments.SummaryPage<>(List.of(), 1, 25, 0)));
        mvc.perform(get("/api/v1/catalog").principal(admin(false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.drug.total").value(1))
                .andExpect(jsonPath("$.drug.items[0].displayName").value("Counter Crocin"))
                .andExpect(jsonPath("$.fmcg.total").value(0));

        mvc.perform(get("/api/v1/catalog"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("This action is not allowed."));
        mvc.perform(get("/api/v1/catalog").principal(staff(StaffSubtype.SUPPORT, false)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/catalog").param("kind", "nope").principal(admin(false)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Filter is not valid"));
    }

    @Test
    void anUnknownProductIsNotFoundAndADuplicateCreateConflicts() throws Exception {
        when(store.findMany(List.of("missing")))
                .thenReturn(new CatalogStore.Found(List.of(), List.of(), List.of("missing")));
        mvc.perform(get("/api/products/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Product was not found"))
                .andExpect(jsonPath("$.drug").isEmpty())
                .andExpect(jsonPath("$.fmcg").isEmpty());

        when(store.createDrug(any())).thenThrow(new CatalogConflict());
        mvc.perform(post("/api/v1/catalog/drugs")
                        .principal(admin(false))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(DRUG))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Product already exists"));

        when(store.updateDrug(any())).thenThrow(new CatalogMissing());
        mvc.perform(put("/api/v1/catalog/drugs/DR100")
                        .principal(staff(StaffSubtype.SALES, false))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(DRUG))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Product was not found"));
    }

    @Test
    void pharmacyAndSupportCannotWrite() throws Exception {
        mvc.perform(post("/api/v1/catalog/drugs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(DRUG))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("This action is not allowed."));
        mvc.perform(post("/api/v1/catalog/drugs")
                        .principal(owner())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(DRUG))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/v1/catalog/fmcg/OTC1")
                        .principal(staff(StaffSubtype.SUPPORT, false))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productId\":\"OTC1\",\"productName\":\"Soap\"}"))
                .andExpect(status().isForbidden());
        verify(store, never()).createDrug(any());
        verify(store, never()).createFmcg(any());
        verify(store, never()).updateFmcg(any());
    }

    private static AccountAuthentication admin(boolean disabled) {
        return account(AccountType.ADMIN, null, null, disabled, Set.of());
    }

    private static AccountAuthentication staff(StaffSubtype subtype, boolean disabled) {
        return account(AccountType.STAFF, null, null, disabled, Set.of(subtype));
    }

    private static AccountAuthentication owner() {
        return account(
                AccountType.PHARMACY,
                UUID.fromString("00000000-0000-4000-8000-000000000010"),
                PharmacyRole.OWNER,
                false,
                Set.of());
    }

    private static AccountAuthentication account(
            AccountType type, UUID pharmacyId, PharmacyRole role, boolean disabled, Set<StaffSubtype> subtypes) {
        AccountPrincipal principal = new AccountPrincipal(
                UUID.randomUUID(),
                "919800000000",
                type,
                "Ada",
                disabled,
                pharmacyId,
                role,
                type == AccountType.PHARMACY ? VerificationStatus.APPROVED : null,
                null,
                null,
                subtypes,
                Set.of(),
                true,
                null);
        return new AccountAuthentication(principal);
    }
}
