package com.medmate.servercore;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest
@AutoConfigureMockMvc
class PharmacyHttpTest {
    private static final String FALLBACK_URL = "jdbc:postgresql://127.0.0.1:5432/pharmacy?currentSchema=server_core_it";
    private static String jdbcUrl = FALLBACK_URL;
    private static String jdbcUser = "pharmacy";
    private static String jdbcPassword = "pharmacy";

    static {
        try {
            PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");
            postgres.start();
            jdbcUrl = postgres.getJdbcUrl();
            jdbcUser = postgres.getUsername();
            jdbcPassword = postgres.getPassword();
        } catch (Throwable ignored) {
            jdbcUrl = FALLBACK_URL;
        }
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> jdbcUrl);
        registry.add("spring.datasource.username", () -> jdbcUser);
        registry.add("spring.datasource.password", () -> jdbcPassword);
        registry.add("spring.flyway.schemas", () -> jdbcUrl.contains("server_core_it") ? "server_core_it" : "public");
        registry.add("spring.flyway.default-schema", () -> jdbcUrl.contains("server_core_it") ? "server_core_it" : "public");
        registry.add("spring.flyway.create-schemas", () -> "true");
    }

    @Autowired
    private MockMvc mvc;

    @Test
    void healthDeleteConsultationAndDevSignup() throws Exception {
        mvc.perform(get("/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ok"));
        mvc.perform(delete("/api/v1/racks/A1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.error.message").value("Records cannot be deleted"));
        mvc.perform(get("/api/v1/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.message").value("No such API"));
        mvc.perform(post("/api/v1/consultations").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Ada\",\"phone\":\"9876543210\",\"companyWebsite\":\"spam\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
        MvcResult signup = mvc.perform(post("/api/v1/auth/otp/verify").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"9876543210\",\"code\":\"123456\",\"name\":\"Owner\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.needsPin").value(true))
                .andReturn();
        String cookie = signup.getResponse().getHeader("Set-Cookie");
        mvc.perform(get("/api/v1/session").header("Cookie", cookie.split(";", 2)[0]))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("Owner"));
        mvc.perform(post("/api/v1/pos/checkout").header("Cookie", cookie.split(";", 2)[0])
                        .contentType(MediaType.APPLICATION_JSON).content("{\"lines\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message").value("Idempotency-Key is required"));
    }
}
