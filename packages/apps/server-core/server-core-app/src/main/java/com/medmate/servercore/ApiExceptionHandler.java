package com.medmate.servercore;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ApiError.class)
    public ResponseEntity<ObjectNode> api(ApiError error) {
        ObjectNode body = errorBody(error.code(), error.getMessage(), error.field());
        return ResponseEntity.status(error.status()).body(body);
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ObjectNode> missing(NoHandlerFoundException exception) {
        return ResponseEntity.status(404).body(errorBody("NOT_FOUND", "No such API", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ObjectNode> unexpected(Exception exception, HttpServletRequest request) {
        boolean production = "production".equals(System.getenv("NODE_ENV")) || "true".equalsIgnoreCase(System.getenv("APP_PRODUCTION"));
        String message = production ? "Something went wrong" : exception.getMessage();
        return ResponseEntity.status(500).body(errorBody("VALIDATION", message == null ? "Something went wrong" : message, null));
    }

    private static ObjectNode errorBody(String code, String message, String field) {
        ObjectNode error = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
        error.put("code", code);
        error.put("message", message);
        if (field != null) {
            error.put("field", field);
        }
        ObjectNode body = error.objectNode();
        body.set("error", error);
        return body;
    }
}
