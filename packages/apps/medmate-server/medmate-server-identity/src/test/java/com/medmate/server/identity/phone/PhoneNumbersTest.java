package com.medmate.server.identity.phone;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PhoneNumbersTest {

    @Test
    void storesAnIndianMobileInE164() {
        assertThat(PhoneNumbers.normalize("9876543210")).isEqualTo("+919876543210");
        assertThat(PhoneNumbers.normalize("+919876543210")).isEqualTo("+919876543210");
        assertThat(PhoneNumbers.normalize(" 98765 43210 ")).isEqualTo("+919876543210");
    }

    @Test
    void rejectsAnythingElse() {
        assertThat(PhoneNumbers.normalize("1234567890")).isNull();
        assertThat(PhoneNumbers.normalize("+14155552671")).isNull();
        assertThat(PhoneNumbers.normalize(null)).isNull();
    }
}
