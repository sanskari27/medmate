package com.medmate.server.identity.session;

import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.StaffSubtype;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.identity.store.IdentityStore;
import com.medmate.server.identity.store.PharmacyStore;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile({"local", "prod", "identity-it"})
public class AccountDirectory {

    private final IdentityStore accounts;
    private final PharmacyStore pharmacies;

    public AccountDirectory(IdentityStore accounts, PharmacyStore pharmacies) {
        this.accounts = accounts;
        this.pharmacies = pharmacies;
    }

    public AccountPrincipal load(UUID id) {
        return accounts.findAccount(id).map(this::principal).orElse(null);
    }

    public AccountPrincipal load(IdentityStore.AccountRow account) {
        return principal(account);
    }

    private AccountPrincipal principal(IdentityStore.AccountRow account) {
        UUID pharmacyId = null;
        PharmacyRole role = null;
        VerificationStatus status = null;
        String stage = null;
        String comment = null;
        if (account.type() == AccountType.PHARMACY) {
            PharmacyStore.PharmacyRow owned =
                    pharmacies.findByOwner(account.id()).orElse(null);
            if (owned != null) {
                pharmacyId = owned.id();
                role = PharmacyRole.OWNER;
                status = owned.status();
                stage = owned.rejectionStage();
                comment = owned.rejectionComment();
            } else {
                UUID memberOf = pharmacies.membership(account.id()).orElse(null);
                if (memberOf != null) {
                    PharmacyStore.PharmacyRow pharmacy =
                            pharmacies.findById(memberOf).orElseThrow();
                    pharmacyId = pharmacy.id();
                    role = PharmacyRole.STAFF;
                    status = pharmacy.status();
                    stage = pharmacy.rejectionStage();
                    comment = pharmacy.rejectionComment();
                }
            }
        }
        Set<StaffSubtype> subtypes = accounts.subtypes(account.id());
        Set<String> permissions = accounts.permissions(account.id());
        boolean pinSet = accounts.pinHash(account.id()).isPresent();
        return new AccountPrincipal(
                account.id(),
                account.phone(),
                account.type(),
                account.displayName(),
                account.disabled(),
                pharmacyId,
                role,
                status,
                stage,
                comment,
                subtypes,
                permissions,
                pinSet);
    }
}
