package com.medmate.server.identity.sms;

public interface SmsSender {

    void send(String phone, String code);
}
