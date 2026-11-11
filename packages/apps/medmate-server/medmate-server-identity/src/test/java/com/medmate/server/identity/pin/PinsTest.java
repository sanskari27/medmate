package com.medmate.server.identity.pin;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PinsTest {

    @Test
    void acceptsFourDigits() {
        assertThat(Pins.valid("1234")).isTrue();
        assertThat(Pins.valid("0000")).isTrue();
    }

    @Test
    void rejectsOtherShapes() {
        assertThat(Pins.valid("123")).isFalse();
        assertThat(Pins.valid("12345")).isFalse();
        assertThat(Pins.valid("12a4")).isFalse();
        assertThat(Pins.valid(null)).isFalse();
    }
}
