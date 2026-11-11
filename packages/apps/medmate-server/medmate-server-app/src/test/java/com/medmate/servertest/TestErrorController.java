package com.medmate.servertest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestErrorController {

    @GetMapping("/test/bad-request")
    void badRequest() {
        throw new IllegalArgumentException("phone is invalid");
    }

    @GetMapping("/test/boom")
    void boom() {
        throw new IllegalStateException("database password");
    }
}
