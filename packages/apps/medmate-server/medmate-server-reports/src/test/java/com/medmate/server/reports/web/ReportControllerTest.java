package com.medmate.server.reports.web;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ReportControllerTest {

    private static final UUID PHARMACY = UUID.fromString("00000000-0000-4000-8000-000000000010");

    private final ReportStore store = Mockito.mock(ReportStore.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new ReportController(
                    new ReportService(store, Clock.fixed(Instant.parse("2026-11-13T08:00:00Z"), ZoneOffset.UTC))))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void readOpensAReportAndExportNeedsItsOwnKey() throws Exception {
        when(store.load(PHARMACY)).thenReturn(ReportBooks.empty());
        mvc.perform(get("/pharmacy/reports/gstr1").principal(staff("reports:read")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("gstr1"))
                .andExpect(jsonPath("$.name").value("GSTR-1 (Sales)"))
                .andExpect(jsonPath("$.from").value("2026-11-01"))
                .andExpect(jsonPath("$.to").value("2026-11-30"))
                .andExpect(jsonPath("$.note").value("No outward supplies in this period."));
        mvc.perform(get("/pharmacy/reports/gstr1/export").principal(staff("reports:read")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Reports cannot be exported"));
        mvc.perform(get("/pharmacy/reports/gstr1/export").principal(staff("reports:export")))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"gstr1.csv\""))
                .andExpect(content().string(org.hamcrest.Matchers.startsWith("GST slab,Qty,Taxable")));
        mvc.perform(get("/pharmacy/reports/gstr1").principal(staff("reports:export")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Reports cannot be read"));
    }

    @Test
    void anUnknownReportAndAReversedRangeAreRejected() throws Exception {
        mvc.perform(get("/pharmacy/reports/balance-sheet").principal(staff("reports:read")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("This report is not available."));
        mvc.perform(get("/pharmacy/reports/gstr1")
                        .principal(staff("reports:read"))
                        .param("from", "2026-11-30")
                        .param("to", "2026-11-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("The date range is not valid."));
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
