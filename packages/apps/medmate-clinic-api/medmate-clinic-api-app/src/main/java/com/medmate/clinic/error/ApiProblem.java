package com.medmate.clinic.error;

import org.springframework.http.HttpStatus;

public final class ApiProblem extends RuntimeException {

    private final HttpStatus status;
    private final String title;

    public ApiProblem(HttpStatus status, String title, String detail) {
        super(detail);
        this.status = status;
        this.title = title;
    }

    public HttpStatus status() {
        return status;
    }

    public String title() {
        return title;
    }
}
