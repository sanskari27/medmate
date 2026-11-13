package com.medmate.server.config;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.servertest.TestErrorController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = TestErrorController.class)
@AutoConfigureMockMvc
@Import({ApiCorsConfiguration.class, OpenSecurityConfig.class, TestErrorController.class})
class ApiCorsTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void allowsTheDispensaryPreflight() throws Exception {
        mvc.perform(options("/auth/otp/send")
                        .header("Origin", "https://dispensary.nammamedmate.com")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://dispensary.nammamedmate.com"))
                .andExpect(header().string("Access-Control-Allow-Methods", containsString("POST")))
                .andExpect(header().string("Access-Control-Allow-Headers", containsString("content-type")));
    }

    @Test
    void allowsThePharmacySite() throws Exception {
        mvc.perform(options("/api/v1/leads")
                        .header("Origin", "https://medmatepharmacy.com")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://medmatepharmacy.com"));
        mvc.perform(options("/api/v1/leads")
                        .header("Origin", "https://www.medmatepharmacy.com")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "https://www.medmatepharmacy.com"));
    }

    @Test
    void rejectsAForeignOrigin() throws Exception {
        mvc.perform(options("/auth/otp/send")
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isForbidden());
    }
}
