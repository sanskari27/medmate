package com.medmate.server.identity.pin;

public final class Pins {

    private Pins() {}

    public static boolean valid(String pin) {
        return pin != null && pin.matches("^[0-9]{4}$");
    }
}
