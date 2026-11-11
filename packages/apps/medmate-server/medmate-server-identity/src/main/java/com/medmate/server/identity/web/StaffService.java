package com.medmate.server.identity.web;

import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.access.AccountType;
import com.medmate.server.identity.access.PharmacyRole;
import com.medmate.server.identity.access.StaffSubtype;
import com.medmate.server.identity.access.VerificationStatus;
import com.medmate.server.identity.phone.PhoneNumbers;
import com.medmate.server.identity.session.AccountCreator;
import com.medmate.server.identity.session.AccountDirectory;
import com.medmate.server.identity.store.IdentityStore;
import com.medmate.server.identity.store.PharmacyStore;
import com.medmate.server.shared.error.ApiProblem;
import java.time.Clock;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class StaffService {

    private final IdentityStore accounts;
    private final PharmacyStore pharmacies;
    private final AccountCreator creator;
    private final AccountDirectory directory;
    private final Clock clock;

    public StaffService(
            IdentityStore accounts,
            PharmacyStore pharmacies,
            AccountCreator creator,
            AccountDirectory directory,
            Clock clock) {
        this.accounts = accounts;
        this.pharmacies = pharmacies;
        this.creator = creator;
        this.directory = directory;
        this.clock = clock;
    }

    @Transactional
    public StaffResponse createPlatform(
            AccountPrincipal actor, String rawPhone, String displayName, List<String> subtypes) {
        requireAdmin(actor);
        String phone = phone(rawPhone);
        String name = name(displayName);
        Set<StaffSubtype> parsed = subtypes(subtypes);
        if (accounts.findAccount(phone, AccountType.ADMIN).isPresent()) {
            throw conflict("A platform admin already exists for this phone");
        }
        if (accounts.findAccount(phone, AccountType.STAFF).isPresent()) {
            throw conflict("A staff account already exists for this phone");
        }
        try {
            IdentityStore.AccountRow created = creator.create(phone, AccountType.STAFF, name, clock.instant());
            accounts.replaceSubtypes(created.id(), parsed);
            return StaffResponse.from(directory.load(created.id()));
        } catch (DuplicateKeyException exception) {
            if (accounts.findAccount(phone, AccountType.ADMIN).isPresent()) {
                throw conflict("A platform admin already exists for this phone");
            }
            throw conflict("A staff account already exists for this phone");
        }
    }

    @Transactional
    public StaffResponse updatePlatform(
            AccountPrincipal actor, UUID id, String displayName, List<String> subtypes, Boolean disabled) {
        requireAdmin(actor);
        AccountPrincipal target = requireType(id, AccountType.STAFF);
        if (displayName != null) {
            accounts.updateDisplayName(id, name(displayName));
        }
        if (subtypes != null) {
            accounts.replaceSubtypes(id, subtypes(subtypes));
        }
        if (disabled != null) {
            accounts.setDisabled(id, disabled);
        }
        return StaffResponse.from(directory.load(target.id()));
    }

    @Transactional
    public StaffResponse createPharmacy(
            AccountPrincipal actor, String rawPhone, String displayName, List<String> permissions) {
        requireApprovedOwner(actor);
        String phone = phone(rawPhone);
        String name = name(displayName);
        Set<String> keys = keys(permissions);
        if (accounts.findAccount(phone, AccountType.PHARMACY).isPresent()) {
            throw conflict("A pharmacy account already exists for this phone");
        }
        try {
            IdentityStore.AccountRow created = creator.create(phone, AccountType.PHARMACY, name, clock.instant());
            pharmacies.addMembership(created.id(), actor.pharmacyId());
            accounts.replacePermissions(created.id(), keys);
            return StaffResponse.from(directory.load(created.id()));
        } catch (DuplicateKeyException exception) {
            throw conflict("A pharmacy account already exists for this phone");
        }
    }

    @Transactional
    public StaffResponse updatePharmacy(
            AccountPrincipal actor, UUID id, String displayName, List<String> permissions, Boolean disabled) {
        requireApprovedOwner(actor);
        AccountPrincipal target = requireType(id, AccountType.PHARMACY);
        if (target.pharmacyRole() != PharmacyRole.STAFF || !actor.pharmacyId().equals(target.pharmacyId())) {
            throw forbidden("Pharmacy staff were not found");
        }
        if (displayName != null) {
            accounts.updateDisplayName(id, name(displayName));
        }
        if (permissions != null) {
            accounts.replacePermissions(id, keys(permissions));
        }
        if (disabled != null) {
            accounts.setDisabled(id, disabled);
        }
        return StaffResponse.from(directory.load(id));
    }

    private AccountPrincipal requireType(UUID id, AccountType type) {
        AccountPrincipal target = directory.load(id);
        if (target == null || target.accountType() != type) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Account was not found");
        }
        return target;
    }

    private static void requireAdmin(AccountPrincipal actor) {
        if (actor.accountType() != AccountType.ADMIN || actor.disabled()) {
            throw forbidden("Only an admin can manage platform staff");
        }
    }

    private static void requireApprovedOwner(AccountPrincipal actor) {
        if (actor.accountType() != AccountType.PHARMACY
                || actor.pharmacyRole() != PharmacyRole.OWNER
                || actor.verificationStatus() != VerificationStatus.APPROVED
                || actor.disabled()) {
            throw forbidden("Only an approved pharmacy owner can manage staff");
        }
    }

    private static String phone(String raw) {
        String phone = PhoneNumbers.normalize(raw);
        if (phone == null) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Enter an Indian mobile number");
        }
        return phone;
    }

    private static String name(String displayName) {
        if (displayName == null || displayName.isBlank() || displayName.trim().length() > 80) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Display name is required");
        }
        return displayName.trim();
    }

    private static Set<StaffSubtype> subtypes(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Choose a staff subtype");
        }
        Set<StaffSubtype> subtypes = new LinkedHashSet<>();
        for (String value : raw) {
            StaffSubtype subtype = StaffSubtype.parse(value);
            if (subtype == null) {
                throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Staff subtype is not recognised");
            }
            subtypes.add(subtype);
        }
        return subtypes;
    }

    private static Set<String> keys(List<String> raw) {
        Set<String> keys = new LinkedHashSet<>();
        if (raw == null) {
            return keys;
        }
        for (String key : raw) {
            if (!Access.validKey(key)) {
                throw new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", "Permission key is invalid");
            }
            keys.add(key);
        }
        return keys;
    }

    private static ApiProblem forbidden(String detail) {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }

    private static ApiProblem conflict(String detail) {
        return new ApiProblem(HttpStatus.CONFLICT, "Conflict", detail);
    }

    public record StaffResponse(
            UUID id,
            String phone,
            String displayName,
            String accountType,
            UUID pharmacyId,
            List<String> subtypes,
            List<String> permissions,
            boolean disabled) {

        static StaffResponse from(AccountPrincipal principal) {
            return new StaffResponse(
                    principal.id(),
                    principal.phone(),
                    principal.displayName(),
                    principal.accountType().wire(),
                    principal.pharmacyId(),
                    principal.subtypes().stream().map(StaffSubtype::wire).toList(),
                    List.copyOf(principal.permissions()),
                    principal.disabled());
        }
    }
}
