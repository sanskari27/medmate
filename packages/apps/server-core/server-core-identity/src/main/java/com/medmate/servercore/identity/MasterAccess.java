package com.medmate.servercore.identity;

public interface MasterAccess {
    boolean isMasterPhone(String phone);

    String createSession(String phone);

    void destroySession(String token);
}
