package com.medmate.clinic.routing;

public final class ClinicUnavailableException extends RuntimeException {

    public ClinicUnavailableException() {
        super("Clinic records are unavailable");
    }

    public ClinicUnavailableException(Throwable cause) {
        super("Clinic records are unavailable", cause);
    }
}
