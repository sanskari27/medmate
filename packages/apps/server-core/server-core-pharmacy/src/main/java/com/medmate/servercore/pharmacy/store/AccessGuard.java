package com.medmate.servercore.pharmacy.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.identity.SessionRow;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.Permissions;
import com.medmate.servercore.kernel.Plans;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.Set;

public final class AccessGuard {
    private AccessGuard() {
    }

    public static void check(ObjectNode state, SessionRow session, String plan, String permission, boolean hospital) {
        if (hospital) {
            requireHospital(state);
        }
        if (plan != null) {
            requirePlan(state, plan);
        }
        String required = permission != null ? permission : plan == null ? null : Permissions.ROUTE_PERM.get(plan);
        if (required != null) {
            requirePerm(state, session.userId(), required);
        }
    }

    public static void requireHospital(ObjectNode state) {
        if (!"hospital".equals(state.path("businessType").asText())) {
            throw new ApiError(403, "FORBIDDEN", "Hospital pharmacy only");
        }
    }

    public static void requirePlan(ObjectNode state, String route) {
        if (locked(state, route)) {
            throw new ApiError(403, "PLAN_LOCKED", "This action needs a paid plan");
        }
    }

    public static void requireAnyPlan(ObjectNode state, String... routes) {
        for (String route : routes) {
            if (!locked(state, route)) {
                return;
            }
        }
        throw new ApiError(403, "PLAN_LOCKED", "This action needs a paid plan");
    }

    public static void requirePerm(ObjectNode state, String userId, String key) {
        ObjectNode user = findUser(state, userId);
        if (user == null) {
            throw new ApiError(403, "FORBIDDEN", "You do not have permission for this action");
        }
        if ("Owner".equals(user.path("role").asText())) {
            return;
        }
        if (!permissionsOf(user).contains(key)) {
            throw new ApiError(403, "FORBIDDEN", "You do not have permission for this action");
        }
    }

    public static boolean allowed(ObjectNode state, SessionRow session, String plan) {
        if (!"hospital".equals(state.path("businessType").asText())) {
            return false;
        }
        try {
            check(state, session, plan, null, true);
            return true;
        } catch (ApiError exception) {
            return false;
        }
    }

    public static Set<String> permissionsOf(ObjectNode user) {
        if (user.has("permissions") && user.get("permissions").isArray()) {
            Set<String> keys = new HashSet<>();
            user.get("permissions").forEach(item -> keys.add(item.asText()));
            return keys;
        }
        return new HashSet<>(Permissions.ROLE_DEFAULT_PERMS.getOrDefault(user.path("role").asText(), Permissions.ALL_PERM_KEYS));
    }

    private static boolean locked(ObjectNode state, String route) {
        ObjectNode subscription = Nodes.object(state, "subscription");
        String plan = subscription == null ? "Essential" : subscription.path("plan").asText("Essential");
        String status = subscription == null ? "active" : subscription.path("status").asText("active");
        String renewsOn = subscription == null ? "—" : subscription.path("renewsOn").asText("—");
        return Plans.routeLocked(route, plan, status, renewsOn, state.path("businessType").asText(), openGrants(state));
    }

    private static Set<String> openGrants(ObjectNode state) {
        Set<String> open = new HashSet<>();
        String today = LocalDate.now(ZoneOffset.UTC).toString();
        ArrayNode grants = Nodes.array(state, "grants");
        if (grants == null) {
            return open;
        }
        for (JsonNode grant : grants) {
            String until = grant.path("until").asText("");
            if (until.isEmpty() || until.compareTo(today) >= 0) {
                open.add(grant.path("route").asText());
            }
        }
        return open;
    }

    private static ObjectNode findUser(ObjectNode state, String userId) {
        ArrayNode users = Nodes.array(state, "users");
        if (users == null) {
            return null;
        }
        for (JsonNode user : users) {
            if (user instanceof ObjectNode object && userId.equals(object.path("id").asText())) {
                return object;
            }
        }
        return null;
    }
}
