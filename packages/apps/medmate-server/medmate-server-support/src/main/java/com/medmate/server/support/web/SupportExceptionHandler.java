package com.medmate.server.support.web;

import com.medmate.server.shared.error.ProblemResponses;
import com.medmate.server.support.access.SupportProblem;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class SupportExceptionHandler {

    @ExceptionHandler(SupportProblem.class)
    ProblemDetail problem(SupportProblem exception, HttpServletRequest request) {
        HttpStatus status =
                exception.kind() == SupportProblem.Kind.CONFLICT ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, exception.getMessage());
        problem.setTitle(status == HttpStatus.CONFLICT ? "Conflict" : "Bad request");
        problem.setProperty("requestId", ProblemResponses.requestId(request));
        return problem;
    }
}
