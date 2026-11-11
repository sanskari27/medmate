package com.medmate.server.shared.error;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.medmate.server.shared.web.RequestIds;
import com.medmate.servertest.TestErrorController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = TestErrorController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({ApiExceptionHandler.class, TestErrorController.class})
class ApiExceptionHandlerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void badRequestUsesProblemDetail() throws Exception {
        mvc.perform(get("/test/bad-request").header(RequestIds.HEADER, "req-example-001"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Bad request"))
                .andExpect(jsonPath("$.detail").value("phone is invalid"))
                .andExpect(jsonPath("$.requestId").value("req-example-001"));
    }

    @Test
    void unexpectedErrorHidesTheCause() throws Exception {
        mvc.perform(get("/test/boom").header(RequestIds.HEADER, "req-example-001"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.title").value("Unexpected error"))
                .andExpect(jsonPath("$.detail").value("Unexpected error"))
                .andExpect(jsonPath("$.detail", not(containsString("password"))))
                .andExpect(jsonPath("$.requestId").value("req-example-001"));
    }
}
