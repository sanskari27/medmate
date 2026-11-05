package com.medmate.servercore.identity;

import org.springframework.stereotype.Component;

@Component
public class NoopOtpDelivery implements OtpDelivery {
    @Override
    public void send(String phone, String otp) {
        // DLT delivery is intentionally a no-op. The OTP is already stored.
    }
}
