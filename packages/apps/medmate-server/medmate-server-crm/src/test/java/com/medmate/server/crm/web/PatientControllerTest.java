package com.medmate.server.crm.web;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.billing.PatientBills;
import com.medmate.server.crm.store.CrmStore;
import com.medmate.server.identity.access.AccountAuthentication;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.shared.error.ApiExceptionHandler;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class PatientControllerTest {

    private static final UUID PHARMACY = UUID.fromString("00000000-0000-4000-8000-000000000010");

    private final PatientBills bills = Mockito.mock(PatientBills.class);
    private final CrmStore store = Mockito.mock(CrmStore.class);
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new PatientController(new PatientService(bills, store)))
            .setControllerAdvice(new ApiExceptionHandler())
            .build();

    @Test
    void readDoesNotExport() throws Exception {
        mvc.perform(get("/pharmacy/patients/export").principal(staff("patients:read")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Patients cannot be updated"));
        verify(bills, never()).sales(PHARMACY);
    }

    @Test
    void updateDoesNotList() throws Exception {
        mvc.perform(get("/pharmacy/patients").principal(staff("patients:update")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Patients cannot be read"));
        verify(bills, never()).sales(PHARMACY);
    }

    @Test
    void aReaderCanList() throws Exception {
        mvc.perform(get("/pharmacy/patients").principal(staff("patients:read")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patients").isEmpty())
                .andExpect(jsonPath("$.summary.chronic").value(0));
        verify(bills).sales(PHARMACY);
    }

    @Test
    void aWriterCanExportAndCannotPatchWithoutTheKey() throws Exception {
        mvc.perform(get("/pharmacy/patients/export").principal(staff("patients:update")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patients").isEmpty());
        mvc.perform(patch("/pharmacy/patients/9886012345")
                        .principal(staff("patients:read"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\":\"hello\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.detail").value("Patients cannot be updated"));
        verify(store, never()).saveProfile(Mockito.eq(PHARMACY), Mockito.anyString(), Mockito.any());
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
