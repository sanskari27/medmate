package com.medmate.server.support.web;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.shared.error.ApiExceptionHandler;
import com.medmate.server.shared.error.ApiProblem;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

@WebMvcTest(controllers = SupportController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({ApiExceptionHandler.class, SupportExceptionHandler.class, SupportController.class})
class SupportControllerTest {

    private static final UUID CASE_ID = UUID.fromString("00000000-0000-4000-8000-000000000401");

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private SupportService support;

    @Test
    void aMissingSessionIsUnauthorized() throws Exception {
        mvc.perform(get("/support/faqs")).andExpect(status().isUnauthorized());
    }

    @Test
    void casesAreAPage() throws Exception {
        when(support.cases(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(new SupportViews.CaseList(List.of(), 1, 25, 4));
        mvc.perform(get("/support/cases").with(owner()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cases").isArray())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(25))
                .andExpect(jsonPath("$.total").value(4));
    }

    @Test
    void aBadCasePageIsRejected() throws Exception {
        mvc.perform(get("/support/cases").param("size", "0").with(owner()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Page is not valid"));
    }

    @Test
    void anOwnerReadsFaqs() throws Exception {
        when(support.faqs(org.mockito.ArgumentMatchers.any())).thenReturn(List.of());

        mvc.perform(get("/support/faqs").with(owner()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void aRejectedCaseIsBadRequest() throws Exception {
        when(support.createCase(
                        org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any(),
                        org.mockito.ArgumentMatchers.any()))
                .thenThrow(new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Category is not recognised."));

        mvc.perform(post("/support/cases")
                        .with(owner())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"kind\":\"ticket\",\"subject\":\"GST\",\"category\":\"Shipping\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Category is not recognised."));
    }

    @Test
    void anAdminClaimIsForbidden() throws Exception {
        when(support.claim(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq(CASE_ID)))
                .thenThrow(new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", "This action is not allowed."));

        mvc.perform(post("/support/cases/" + CASE_ID + "/claim").with(owner()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("This action is not allowed."));
    }

    @Test
    void anUnknownCaseIsNotFound() throws Exception {
        when(support.caseDetail(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq(CASE_ID)))
                .thenThrow(new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Support case was not found."));

        mvc.perform(get("/support/cases/" + CASE_ID).with(owner()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Support case was not found."));
    }

    @Test
    void aSecondClaimConflicts() throws Exception {
        when(support.claim(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq(CASE_ID)))
                .thenThrow(new ApiProblem(HttpStatus.CONFLICT, "Conflict", "This chat has already been picked up."));

        mvc.perform(post("/support/cases/" + CASE_ID + "/claim").with(owner()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("This chat has already been picked up."));
    }

    private static RequestPostProcessor owner() {
        AccountPrincipal principal = new AccountPrincipal(
                UUID.randomUUID(),
                "919800000000",
                AccountType.PHARMACY,
                "Ada",
                false,
                UUID.randomUUID(),
                PharmacyRole.OWNER,
                VerificationStatus.APPROVED,
                null,
                null,
                Set.of(),
                Set.of(),
                true,
                null);
        Authentication authentication = new AccountAuthentication(principal);
        return request -> {
            request.setUserPrincipal(authentication);
            return request;
        };
    }
}
