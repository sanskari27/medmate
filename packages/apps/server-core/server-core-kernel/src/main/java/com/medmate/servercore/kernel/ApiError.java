package com.medmate.servercore.kernel;

public class ApiError extends RuntimeException {
    private final int status;
    private final String code;
    private final String field;

    public ApiError(int status, String code, String message) {
        this(status, code, message, null);
    }

    public ApiError(int status, String code, String message, String field) {
        super(message);
        this.status = status;
        this.code = code;
        this.field = field;
    }

    public int status() {
        return status;
    }

    public String code() {
        return code;
    }

    public String field() {
        return field;
    }

    public static ApiError fail(int status, String code, String message) {
        throw new ApiError(status, code, message);
    }

    public static ApiError fail(int status, String code, String message, String field) {
        throw new ApiError(status, code, message, field);
    }
}
