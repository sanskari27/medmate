package com.medmate.server.support.access;

public final class SupportProblem extends RuntimeException {

    public enum Kind {
        BAD_REQUEST,
        CONFLICT
    }

    private final Kind kind;

    public SupportProblem(Kind kind, String detail) {
        super(detail);
        this.kind = kind;
    }

    public Kind kind() {
        return kind;
    }
}
