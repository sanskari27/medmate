package com.medmate.servercore.identity;

import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.UUID;

public interface PharmacyAccounts {
    record Login(UUID pharmacyId, String userId, String pinHash) {
    }

    record Created(UUID id, String pricingPin) {
    }

    Login findLogin(String phone);

    void setLoginPin(UUID pharmacyId, String phone, String pin);

    Created insertOwner(String phone, String name, String businessType);

    ObjectNode loadState(UUID pharmacyId);

    ObjectNode sessionView(ObjectNode state, SessionRow session);
}
