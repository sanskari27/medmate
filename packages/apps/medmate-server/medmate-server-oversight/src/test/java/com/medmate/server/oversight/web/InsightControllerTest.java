package com.medmate.server.oversight.web;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.StaffSubtype;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.oversight.store.InsightStore;
import com.medmate.server.reports.ReportBooks;
import com.medmate.server.reports.store.ReportStore;
import com.medmate.server.shared.error.ApiExceptionHandler;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class InsightControllerTest {

    private static final UUID PHARMACY = UUID.fromString("00000000-0000-4000-8000-000000000010");

    private final InsightStore store = Mockito.mock(InsightStore.class);
    private final ReportStore reports = Mockito.mock(ReportStore.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new InsightController(new InsightService(
                    store, reports, Clock.fixed(Instant.parse("2026-11-14T08:00:00Z"), ZoneOffset.UTC))))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void anAdminReadsTheFleetAndOnePharmacy() throws Exception {
        when(store.profiles()).thenReturn(List.of());
        when(store.resolveHours()).thenReturn(List.of());
        when(store.openCases()).thenReturn(0);
        when(store.ticketRanks()).thenReturn(List.of());
        when(store.exists(PHARMACY)).thenReturn(true);
        when(reports.load(any())).thenReturn(ReportBooks.empty());
        when(store.activity(PHARMACY)).thenReturn(InsightStore.Activity.empty());
        mvc.perform(get("/pharmacy-insights").principal(reader(AccountType.ADMIN, Set.of())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.rankingRange").value("30d"))
                .andExpect(jsonPath("$.status.approved").value(0))
                .andExpect(jsonPath("$.support.open").value(0));
        mvc.perform(get("/pharmacy-insights/" + PHARMACY)
                        .principal(reader(AccountType.STAFF, Set.of(StaffSubtype.SALES))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.range").value("30d"))
                .andExpect(jsonPath("$.commercial.today.netSales").value("0.00"))
                .andExpect(jsonPath("$.commercial.month.netProfit").value("0.00"))
                .andExpect(jsonPath("$.stock.out").value(0))
                .andExpect(jsonPath("$.people.patients.buyers").value(0))
                .andExpect(jsonPath("$.cases").isArray());
    }

    @Test
    void aPharmacyAccountAndABadRangeAndAMissingPharmacyAreRefused() throws Exception {
        mvc.perform(get("/pharmacy-insights").principal(pharmacy()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Pharmacy insights are not available"));
        when(store.exists(PHARMACY)).thenReturn(true);
        mvc.perform(get("/pharmacy-insights/" + PHARMACY)
                        .principal(reader(AccountType.ADMIN, Set.of()))
                        .param("range", "year"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("The date range is not valid."));
        when(store.exists(PHARMACY)).thenReturn(false);
        mvc.perform(get("/pharmacy-insights/" + PHARMACY).principal(reader(AccountType.ADMIN, Set.of())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Pharmacy was not found"));
    }

    private static AccountAuthentication reader(AccountType type, Set<StaffSubtype> subtypes) {
        return new AccountAuthentication(new AccountPrincipal(
                UUID.randomUUID(),
                "919800000000",
                type,
                "Ada",
                false,
                null,
                null,
                null,
                null,
                null,
                subtypes,
                Set.of(),
                true,
                null));
    }

    private static AccountAuthentication pharmacy() {
        return new AccountAuthentication(new AccountPrincipal(
                UUID.randomUUID(),
                "919800000000",
                AccountType.PHARMACY,
                "Ada",
                false,
                PHARMACY,
                PharmacyRole.OWNER,
                VerificationStatus.APPROVED,
                null,
                null,
                Set.of(),
                Set.of(),
                true,
                null));
    }
}
