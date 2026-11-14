package com.medmate.server.prep.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.catalog.CatalogStore;
import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.StaffSubtype;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.prep.store.PrepStore;
import com.medmate.server.shared.error.ApiExceptionHandler;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class PrepControllerTest {

    private static final Instant NOW = Instant.parse("2026-11-15T08:00:00Z");
    private static final UUID OWNER = UUID.fromString("00000000-0000-4000-8000-0000000000aa");
    private static final UUID OTHER = UUID.fromString("00000000-0000-4000-8000-0000000000bb");
    private static final UUID LIST = UUID.fromString("00000000-0000-4000-8000-0000000000c1");

    private final PrepStore store = Mockito.mock(PrepStore.class);

    @SuppressWarnings("unchecked")
    private final ObjectProvider<CatalogStore> catalogs = Mockito.mock(ObjectProvider.class);

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(
                    new PrepController(new PrepService(store, catalogs, Clock.fixed(NOW, ZoneOffset.UTC))))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void missingSessionAndOtherStaffAreRejected() throws Exception {
        mvc.perform(get("/api/v1/inventory-prep"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("This action is not allowed."));
        mvc.perform(get("/api/v1/inventory-prep").principal(staff(StaffSubtype.SUPPORT, false)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("This action is not allowed."));
        mvc.perform(get("/api/v1/inventory-prep").principal(staff(StaffSubtype.SALES, true)))
                .andExpect(status().isForbidden());
        verify(store, never()).list(any());
    }

    @Test
    void anotherOwnersListIsMissing() throws Exception {
        when(store.list(OWNER)).thenReturn(List.of());
        mvc.perform(get("/api/v1/inventory-prep").principal(sales()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lists").isEmpty());

        when(store.find(LIST)).thenReturn(Optional.of(new PrepStore.Header(LIST, OTHER, "City opening", NOW)));
        mvc.perform(get("/api/v1/inventory-prep/" + LIST).principal(sales()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("List was not found"));

        when(store.nameTaken(eq(OWNER), eq("City opening"), eq(null))).thenReturn(true);
        mvc.perform(post("/api/v1/inventory-prep")
                        .principal(sales())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"City opening\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("List name already exists"));
        verify(store, never()).insert(any(), any(), any());
    }

    private static AccountAuthentication sales() {
        return account(AccountType.STAFF, false, Set.of(StaffSubtype.SALES));
    }

    private static AccountAuthentication staff(StaffSubtype subtype, boolean disabled) {
        return account(AccountType.STAFF, disabled, Set.of(subtype));
    }

    private static AccountAuthentication account(AccountType type, boolean disabled, Set<StaffSubtype> subtypes) {
        AccountPrincipal principal = new AccountPrincipal(
                OWNER,
                "919800000000",
                type,
                "Ada",
                disabled,
                null,
                type == AccountType.PHARMACY ? PharmacyRole.OWNER : null,
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
