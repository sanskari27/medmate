package com.medmate.server.shared.error;

import com.medmate.server.shared.web.RequestIds;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail badRequest(IllegalArgumentException exception, HttpServletRequest request) {
        log.warn("Rejected request {}", requestId(request));
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
        problem.setTitle("Bad request");
        problem.setProperty("requestId", requestId(request));
        return problem;
    }

    @ExceptionHandler(Exception.class)
    ProblemDetail unexpected(Exception exception, HttpServletRequest request) throws Exception {
        if (exception instanceof ErrorResponse) {
            throw exception;
        }
        String requestId = requestId(request);
        log.error("Unhandled error {}", requestId, exception);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error");
        problem.setTitle("Unexpected error");
        problem.setProperty("requestId", requestId);
        return problem;
    }

    private static String requestId(HttpServletRequest request) {
        Object current = request.getAttribute(RequestIds.ATTRIBUTE);
        if (current instanceof String id && !id.isBlank()) {
            return id;
        }
        return RequestIds.resolve(request.getHeader(RequestIds.HEADER));
    }
}
