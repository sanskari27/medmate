package com.medmate.servercore.pharmacy.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.identity.PharmacyAccounts;
import com.medmate.servercore.identity.SecretHashes;
import com.medmate.servercore.identity.SessionRow;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.EmptyPharmacy;
import com.medmate.servercore.kernel.Permissions;
import com.medmate.servercore.kernel.PhoneNumbers;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class PharmacyAccountService implements PharmacyAccounts {
    private final JdbcTemplate jdbc;
    private final PharmacyStore store;
    private final SessionViews views;
    private final ObjectMapper mapper;

    public PharmacyAccountService(JdbcTemplate jdbc, PharmacyStore store, SessionViews views, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.store = store;
        this.views = views;
        this.mapper = mapper;
    }

    @Override
    public Login findLogin(String phone) {
        return jdbc.query("SELECT pharmacy_id, user_id, login_pin_hash FROM staff_phones WHERE phone = ?", result -> {
            if (!result.next()) {
                return null;
            }
            return new Login(result.getObject("pharmacy_id", UUID.class), result.getString("user_id"), result.getString("login_pin_hash"));
        }, PhoneNumbers.e164(phone));
    }

    @Override
    public void setLoginPin(UUID pharmacyId, String phone, String pin) {
        int updated = jdbc.update("UPDATE staff_phones SET login_pin_hash = ? WHERE pharmacy_id = ? AND phone = ?",
                SecretHashes.hashSecret(pin), pharmacyId, PhoneNumbers.e164(phone));
        if (updated == 0) {
            throw new ApiError(404, "NOT_FOUND", "No login for this phone");
        }
    }

    @Override
    public Created insertOwner(String phone, String name, String businessType) {
        ObjectNode state = EmptyPharmacy.create(mapper, name, phone, businessType);
        ObjectNode owner = state.withArray("users").addObject();
        owner.put("id", "u1");
        owner.put("name", name == null || name.isBlank() ? "Owner" : name.trim());
        owner.put("role", "Owner");
        owner.put("phone", phone);
        owner.put("email", "");
        owner.put("active", true);
        owner.put("lastActiveMins", 0);
        owner.put("pin", "");
        var permissions = owner.putArray("permissions");
        Permissions.ALL_PERM_KEYS.forEach(permissions::add);
        PharmacyStore.Created created = store.insert(phone, businessType, state);
        return new Created(created.id(), created.pricingPin());
    }

    @Override
    public ObjectNode loadState(UUID pharmacyId) {
        return store.load(pharmacyId);
    }

    @Override
    public ObjectNode sessionView(ObjectNode state, SessionRow session) {
        return views.view(state, session);
    }
}
