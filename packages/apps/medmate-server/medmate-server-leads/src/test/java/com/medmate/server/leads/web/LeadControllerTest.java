package com.medmate.server.leads.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.StaffSubtype;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.leads.store.LeadStore;
import com.medmate.server.shared.error.ApiExceptionHandler;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class LeadControllerTest {

    private static final Instant NOW = Instant.parse("2026-11-14T08:00:00Z");
    private static final UUID LEAD = UUID.fromString("00000000-0000-4000-8000-000000000211");
    private static final String CONTACT =
            """
            {"site":"nammamedmate","type":"contact","name":"Ada","email":"ada@example.com","subject":"Order issue","message":"Need help"}
            """;

    private final LeadStore store = Mockito.mock(LeadStore.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(
                    new LeadController(new LeadService(store, Clock.fixed(NOW, java.time.ZoneOffset.UTC))))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void anonymousCreateStoresALeadAndDropsAHoneypot() throws Exception {
        when(store.insert(any(), eq(NOW))).thenAnswer(call -> row("new"));
        mvc.perform(post("/api/v1/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(CONTACT))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lead.status").value("new"))
                .andExpect(jsonPath("$.lead.email").value("ada@example.com"));
        verify(store).insert(any(), eq(NOW));

        mvc.perform(
                        post("/api/v1/leads")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"site":"nammamedmate","type":"contact","companyWebsite":"https://spam.example"}
                                """))
                .andExpect(status().isNoContent());
        verify(store).insert(any(), eq(NOW));
    }

    @Test
    void invalidLeadAndMissingSessionAndOtherAccountsAreRejected() throws Exception {
        mvc.perform(post("/api/v1/leads")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Lead is not valid"));
        verify(store, never()).insert(any(), any());

        mvc.perform(get("/api/v1/leads"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("This action is not allowed."));
        mvc.perform(get("/api/v1/leads").principal(owner()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("This action is not allowed."));
        mvc.perform(get("/api/v1/leads").principal(staff(StaffSubtype.FINANCE, false)))
                .andExpect(status().isForbidden());
        mvc.perform(patch("/api/v1/leads/" + LEAD)
                        .principal(staff(StaffSubtype.SUPPORT, true))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"contacted\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/leads?status=nope").principal(admin(false)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Status is not valid"));
        mvc.perform(get("/api/v1/leads?size=101").principal(admin(false)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Page is not valid"));
    }

    @Test
    void adminListsAndSupportMarksAndAnUnknownIdIsMissing() throws Exception {
        when(store.count("", "", "")).thenReturn(1);
        when(store.page("", "", "", 25, 0)).thenReturn(List.of(row("new")));
        mvc.perform(get("/api/v1/leads").principal(admin(false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.leads[0].name").value("Ada"))
                .andExpect(jsonPath("$.total").value(1));

        when(store.find(LEAD)).thenReturn(Optional.empty());
        mvc.perform(get("/api/v1/leads/" + LEAD).principal(admin(false)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Lead was not found"));

        when(store.updateStatus(LEAD, "contacted")).thenReturn(Optional.of(row("contacted")));
        mvc.perform(patch("/api/v1/leads/" + LEAD)
                        .principal(staff(StaffSubtype.SUPPORT, false))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"contacted\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lead.status").value("contacted"));

        when(store.updateStatus(LEAD, "new")).thenReturn(Optional.of(row("new")));
        mvc.perform(patch("/api/v1/leads/" + LEAD)
                        .principal(admin(false))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"new\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lead.status").value("new"));
    }

    private static LeadStore.LeadRow row(String status) {
        return new LeadStore.LeadRow(
                LEAD,
                "nammamedmate",
                "contact",
                status,
                NOW,
                "Ada",
                null,
                "ada@example.com",
                null,
                null,
                null,
                null,
                null,
                null,
                "Order issue",
                "Need help",
                null,
                null,
                null,
                null);
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
