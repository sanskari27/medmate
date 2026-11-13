package com.medmate.server.identity.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.shared.error.ApiExceptionHandler;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class DirectoryPageControllerTest {

    private final ReviewService reviews = Mockito.mock(ReviewService.class);
    private final OwnerDirectoryService owners = Mockito.mock(OwnerDirectoryService.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(
                    new ReviewController(reviews), new OwnerDirectoryController(owners))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void aBadOwnerPageIsRejected() throws Exception {
        mvc.perform(get("/pharmacy-owners").param("size", "101").principal(reader()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Page is not valid"));
    }

    @Test
    void ownersAndApplicationsKeepThePageEnvelope() throws Exception {
        when(owners.list(any(), any())).thenReturn(new OwnerDirectoryService.OwnerList(List.of(), 1, 25, 8));
        when(reviews.list(any(), any(), any())).thenReturn(new ReviewService.ApplicationList(List.of(), 1, 25, 2));
        mvc.perform(get("/pharmacy-owners").principal(reader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.owners").isArray())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.total").value(8));
        mvc.perform(get("/pharmacy-applications").principal(reader()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applications").isArray())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(25))
                .andExpect(jsonPath("$.total").value(2));
    }

    private static AccountAuthentication reader() {
        AccountPrincipal principal = new AccountPrincipal(
                UUID.randomUUID(),
                "919800000000",
                AccountType.ADMIN,
                "Ada",
                false,
                null,
                PharmacyRole.OWNER,
                VerificationStatus.APPROVED,
                null,
                null,
                Set.of(),
                Set.of(),
                true);
        return new AccountAuthentication(principal);
    }
}
