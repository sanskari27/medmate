package com.medmate.servercore.identity;

public interface OtpDelivery {
    void send(String phone, String otp);
}
