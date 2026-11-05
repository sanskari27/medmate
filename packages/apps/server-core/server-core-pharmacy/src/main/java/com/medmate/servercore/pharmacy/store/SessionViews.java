package com.medmate.servercore.pharmacy.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.identity.SessionRow;
import com.medmate.servercore.kernel.Permissions;
import org.springframework.stereotype.Component;

@Component
public class SessionViews {
    private final ObjectMapper mapper;

    public SessionViews(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public ObjectNode view(ObjectNode state, SessionRow session) {
        ObjectNode user = null;
        ArrayNode users = NodesArray(state, "users");
        if (users != null) {
            for (JsonNode row : users) {
                if (session.userId().equals(row.path("id").asText()) && row instanceof ObjectNode object) {
                    user = object;
                }
            }
        }
        ObjectNode summary = mapper.createObjectNode();
        ArrayNode permissions = summary.putArray("permissions");
        if (user == null) {
            summary.put("id", session.userId());
            summary.put("phone", session.phone());
            summary.put("role", "Owner");
            Permissions.ALL_PERM_KEYS.forEach(permissions::add);
        } else {
            summary.put("id", user.path("id").asText());
            summary.put("name", user.path("name").asText());
            summary.put("role", user.path("role").asText());
            summary.put("phone", user.path("phone").asText());
            if ("Owner".equals(user.path("role").asText())) {
                Permissions.ALL_PERM_KEYS.forEach(permissions::add);
            } else {
                AccessGuard.permissionsOf(user).forEach(permissions::add);
            }
        }
        ObjectNode view = mapper.createObjectNode();
        view.set("user", summary);
        view.put("businessType", state.path("businessType").asText());
        view.put("setupComplete", state.path("setupComplete").asBoolean(false));
        copy(view, state, "subscription", "grants", "subscriptionRequests", "creditPayments", "caShares", "wardSupplies", "hospitalPayments", "tpaClaims", "hospitalPriceRules", "profile", "invoiceSettings", "kiosk", "inventory", "racks", "sales", "prescriptions", "offers", "purchases", "suppliers", "supplyList", "purchaseOrders", "expenses", "expenseCategories", "employees", "users", "bankAccount", "advisors", "crm", "tickets");
        view.put("extraSeats", state.path("extraSeats").asInt(0));
        view.put("couponRedeemed", state.path("couponRedeemed").asBoolean(false));
        if (!state.has("referrals") || state.get("referrals").isNull()) {
            view.putArray("referrals");
        } else {
            view.set("referrals", state.get("referrals"));
        }
        if (session.impersonator() == null) {
            view.putNull("impersonator");
        } else {
            view.put("impersonator", session.impersonator());
        }
        view.put("needsPin", !session.hasPin() && session.impersonator() == null);
        hospital(view, state, session, "wards", "wards");
        hospital(view, state, session, "wards", "admissions");
        hospital(view, state, session, "indents", "wardIndents");
        hospital(view, state, session, "doctors", "doctors");
        if (AccessGuard.allowed(state, session, "hospbill")) {
            view.set("hospitalAccount", state.get("hospitalAccount"));
        } else {
            view.putNull("hospitalAccount");
        }
        if (AccessGuard.allowed(state, session, "departments")) {
            view.set("departments", state.has("departments") ? state.get("departments") : mapper.createArrayNode());
        } else {
            view.putArray("departments");
        }
        return view;
    }

    private void hospital(ObjectNode view, ObjectNode state, SessionRow session, String plan, String field) {
        if (AccessGuard.allowed(state, session, plan)) {
            view.set(field, state.get(field));
        } else {
            view.putArray(field);
        }
    }

    private static void copy(ObjectNode view, ObjectNode state, String... fields) {
        for (String field : fields) {
            if (state.has(field)) {
                view.set(field, state.get(field));
            } else {
                view.putNull(field);
            }
        }
    }

    private static ArrayNode NodesArray(ObjectNode state, String field) {
        return state.get(field) instanceof ArrayNode array ? array : null;
    }
}
