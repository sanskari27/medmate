package com.medmate.server.dashboard.web;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.reports.ReportBooks;
import com.medmate.server.reports.store.ReportStore;
import com.medmate.server.shared.error.ApiExceptionHandler;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class DashboardControllerTest {

    private static final UUID PHARMACY = UUID.fromString("00000000-0000-4000-8000-000000000010");

    private final ReportStore store = Mockito.mock(ReportStore.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new DashboardController(
                    new DashboardService(store, Clock.fixed(Instant.parse("2026-11-13T08:00:00Z"), ZoneOffset.UTC))))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void anOwnerAndStaffWithNoPermissionsCanRead() throws Exception {
        when(store.load(PHARMACY)).thenReturn(ReportBooks.empty());
        mvc.perform(get("/pharmacy/dashboard").principal(member(PharmacyRole.OWNER, VerificationStatus.APPROVED)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.range").value("7d"))
                .andExpect(jsonPath("$.from").value("2026-11-07"))
                .andExpect(jsonPath("$.to").value("2026-11-13"))
                .andExpect(jsonPath("$.today.netSales").value("0.00"))
                .andExpect(jsonPath("$.today.returns").value("0.00"))
                .andExpect(jsonPath("$.today.returnCount").value(0))
                .andExpect(jsonPath("$.month.purchases").value("0.00"))
                .andExpect(jsonPath("$.month.expenses").value("0.00"))
                .andExpect(jsonPath("$.stock.out").value(0))
                .andExpect(jsonPath("$.stock.cost").value("0.00"))
                .andExpect(jsonPath("$.stock.retail").value("0.00"))
                .andExpect(jsonPath("$.window.returns").value("0.00"))
                .andExpect(jsonPath("$.window.margin").value("0.00"))
                .andExpect(jsonPath("$.window.buckets.length()").value(7));
        mvc.perform(get("/pharmacy/dashboard").principal(member(PharmacyRole.STAFF, VerificationStatus.APPROVED)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dues.bills").value(0));
    }

    @Test
    void aPendingPharmacyAndABadRangeAreRefused() throws Exception {
        mvc.perform(get("/pharmacy/dashboard").principal(member(PharmacyRole.OWNER, VerificationStatus.PENDING_ADMIN)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("The dashboard cannot be read."));
        mvc.perform(get("/pharmacy/dashboard")
                        .principal(member(PharmacyRole.OWNER, VerificationStatus.APPROVED))
                        .param("range", "year"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("The date range is not valid."));
    }

    private static AccountAuthentication member(PharmacyRole role, VerificationStatus status) {
        AccountPrincipal principal = new AccountPrincipal(
                UUID.randomUUID(),
                "919800000000",
                AccountType.PHARMACY,
                "Ada",
                false,
                PHARMACY,
                role,
                status,
                null,
                null,
                Set.of(),
                Set.of(),
                true,
                null);
        return new AccountAuthentication(principal);
    }
}
