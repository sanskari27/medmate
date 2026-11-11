package com.medmate.server.identity.session;

import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.store.IdentityStore;
import com.medmate.server.identity.store.PharmacyStore;
import java.time.Instant;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class AccountCreator {

    private final IdentityStore accounts;
    private final PharmacyStore pharmacies;

    public AccountCreator(IdentityStore accounts, PharmacyStore pharmacies) {
        this.accounts = accounts;
        this.pharmacies = pharmacies;
    }

    @Transactional
    public IdentityStore.AccountRow createOwner(String phone, Instant now) {
        UUID id = UUID.randomUUID();
        accounts.insertAccount(id, phone, AccountType.PHARMACY, null, now);
        pharmacies.insertPharmacy(UUID.randomUUID(), id, now);
        return accounts.findAccount(id).orElseThrow();
    }

    @Transactional
    public IdentityStore.AccountRow create(String phone, AccountType type, String displayName, Instant now) {
        UUID id = UUID.randomUUID();
        accounts.insertAccount(id, phone, type, displayName, now);
        return accounts.findAccount(id).orElseThrow();
    }
}
