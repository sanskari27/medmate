package com.medmate.server.identity.sms;

import com.medmate.server.identity.otp.OtpPurpose;

public interface SmsSender {

    void send(String phone, String code, OtpPurpose purpose);
}
