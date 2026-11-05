package com.medmate.servercore.master;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.identity.AuthService;
import com.medmate.servercore.identity.SessionRepository;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.Plans;
import com.medmate.servercore.pharmacy.store.PharmacyStore;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class MasterWrites {
    private static final int REFERRAL_REWARD = 500;
    private final PharmacyStore store;
    private final SessionRepository sessions;
    private final AuthService auth;
    private final ObjectMapper mapper;

    public MasterWrites(PharmacyStore store, SessionRepository sessions, AuthService auth, ObjectMapper mapper) {
        this.store = store;
        this.sessions = sessions;
        this.auth = auth;
        this.mapper = mapper;
    }

    public JsonNode plan(String phone, String id, JsonNode body) {
        String plan = requiredPlan(body.path("plan").asText());
        String cycle = cycle(body.path("cycle").asText());
        String renews = Plans.isFreePlan(plan) && (body.path("renewsOn").isNull() || body.path("renewsOn").asText("").isEmpty() || "—".equals(body.path("renewsOn").asText()))
                ? "—" : date(body.path("renewsOn").asText(), "Enter a renewal date");
        return write(phone, id, "plan", body.path("reason").asText(""), state -> {
            ObjectNode before = mapper.createObjectNode();
            before.put("plan", state.path("subscription").path("plan").asText());
            before.put("cycle", state.path("subscription").path("cycle").asText());
            before.put("renewsOn", state.path("subscription").path("renewsOn").asText());
            boolean lapsed = !Plans.isFreePlan(plan) && !"—".equals(renews) && renews.compareTo(Plans.todayIso()) < 0;
            ObjectNode subscription = (ObjectNode) state.get("subscription");
            subscription.put("plan", plan);
            subscription.put("cycle", cycle);
            subscription.put("renewsOn", renews);
            subscription.put("status", lapsed ? "expired" : "active");
            markRequests(state);
            ObjectNode after = mapper.createObjectNode();
            after.put("plan", plan);
            after.put("cycle", cycle);
            after.put("renewsOn", renews);
            after.put("status", subscription.path("status").asText());
            return new Change(before, after);
        });
    }

    public JsonNode grants(String phone, String id, JsonNode body) {
        if (body == null || !body.path("grants").isArray()) {
            throw new ApiError(400, "VALIDATION", "Send the grant list");
        }
        ArrayNode grants = mapper.createArrayNode();
        for (JsonNode item : body.get("grants")) {
            String route = item.path("route").asText("");
            if (!Plans.PREMIUM_ROUTES.contains(route)) {
                throw new ApiError(400, "VALIDATION", "Unknown screen");
            }
            ObjectNode grant = grants.addObject();
            grant.put("route", route);
            if (item.hasNonNull("until")) {
                grant.put("until", date(item.path("until").asText(), "Enter a grant expiry date"));
            }
        }
        return write(phone, id, "grants", body.path("reason").asText(""), state -> {
            JsonNode before = state.has("grants") ? state.get("grants").deepCopy() : mapper.createArrayNode();
            state.set("grants", grants);
            return new Change(before, grants);
        });
    }

    public JsonNode seats(String phone, String id, JsonNode body) {
        double raw = body.path("extraSeats").asDouble(Double.NaN);
        if (raw != Math.rint(raw) || raw < 0) {
            throw new ApiError(400, "VALIDATION", "Extra seats must be a whole number");
        }
        int extra = (int) raw;
        return write(phone, id, "seats", body.path("reason").asText(""), state -> {
            assertExtra(state.path("subscription").path("plan").asText(), extra);
            int before = state.path("extraSeats").asInt(0);
            if (before == extra) {
                return null;
            }
            state.put("extraSeats", extra);
            return new Change(mapper.getNodeFactory().numberNode(before), mapper.getNodeFactory().numberNode(extra));
        });
    }

    public JsonNode businessType(String phone, String id, JsonNode body) {
        String kind = body.path("businessType").asText();
        if (!"hospital".equals(kind) && !"pharmacy".equals(kind)) {
            throw new ApiError(400, "VALIDATION", "Choose a business type");
        }
        return write(phone, id, "business-type", body.path("reason").asText(""), state -> {
            String before = state.path("businessType").asText();
            if (before.equals(kind)) {
                return null;
            }
            state.put("businessType", kind);
            return new Change(mapper.getNodeFactory().textNode(before), mapper.getNodeFactory().textNode(kind));
        });
    }

    public JsonNode ticket(String phone, String id, String ticketId, JsonNode body) {
        String status = body.path("status").asText();
        if (!"Open".equals(status) && !"Resolved".equals(status)) {
            throw new ApiError(400, "VALIDATION", "Choose a ticket status");
        }
        return write(phone, id, "ticket", body.path("reason").asText(""), state -> {
            ObjectNode previous = Nodes.findId(state.withArray("tickets"), ticketId);
            if (previous == null) {
                throw new ApiError(404, "NOT_FOUND", "Ticket not found");
            }
            if (status.equals(previous.path("status").asText())) {
                return null;
            }
            ObjectNode before = mapper.createObjectNode().put("id", ticketId).put("status", previous.path("status").asText());
            previous.put("status", status);
            return new Change(before, mapper.createObjectNode().put("id", ticketId).put("status", status));
        });
    }

    public JsonNode earn(String phone, String id, String referralId, JsonNode body) {
        return write(phone, id, "referral-earned", body.path("reason").asText(""), state -> {
            ObjectNode previous = referral(state, referralId);
            if ("Paid".equals(previous.path("status").asText())) {
                throw new ApiError(403, "FORBIDDEN", "A paid referral cannot be changed");
            }
            if ("Earned".equals(previous.path("status").asText()) && previous.path("reward").asInt() == REFERRAL_REWARD) {
                return null;
            }
            ObjectNode before = mapper.createObjectNode().put("id", previous.path("id").asText()).put("status", previous.path("status").asText()).put("reward", previous.path("reward").asDouble());
            previous.put("status", "Earned");
            previous.put("reward", REFERRAL_REWARD);
            return new Change(before, mapper.createObjectNode().put("id", previous.path("id").asText()).put("status", "Earned").put("reward", REFERRAL_REWARD));
        });
    }

    public JsonNode pay(String phone, String id, String referralId, JsonNode body) {
        return write(phone, id, "referral-paid", body.path("reason").asText(""), state -> {
            ObjectNode previous = referral(state, referralId);
            if ("Paid".equals(previous.path("status").asText())) {
                return null;
            }
            if (!"Earned".equals(previous.path("status").asText())) {
                throw new ApiError(400, "VALIDATION", "Earn the reward before paying it");
            }
            ObjectNode before = previous.deepCopy();
            previous.put("status", "Paid");
            previous.put("reward", REFERRAL_REWARD);
            previous.put("paidAt", System.currentTimeMillis());
            previous.put("paidBy", phone);
            ObjectNode after = mapper.createObjectNode();
            after.put("id", previous.path("id").asText());
            after.put("status", "Paid");
            after.put("reward", REFERRAL_REWARD);
            after.put("paidAt", previous.path("paidAt").asLong());
            after.put("paidBy", phone);
            return new Change(before, after);
        });
    }

    public SessionRepository.Issued impersonate(String phone, String id) {
        UUID pharmacyId = MasterLists.parse(id);
        ObjectNode state = store.load(pharmacyId);
        ObjectNode owner = null;
        ObjectNode active = null;
        for (JsonNode node : state.withArray("users")) {
            if (!(node instanceof ObjectNode user) || (user.has("active") && !user.get("active").asBoolean())) {
                continue;
            }
            if (active == null) {
                active = user;
            }
            if ("Owner".equals(user.path("role").asText())) {
                owner = user;
            }
        }
        ObjectNode chosen = owner == null ? active : owner;
        if (chosen == null) {
            throw new ApiError(404, "NOT_FOUND", "This pharmacy has no active user");
        }
        String loginPhone = chosen.path("phone").asText(state.path("profile").path("phone").asText());
        SessionRepository.Issued issued = sessions.create(pharmacyId, chosen.path("id").asText(), loginPhone, phone, auth.secret());
        try {
            store.withState(pharmacyId, (current, connection) -> {
                audit(connection, phone, pharmacyId, "impersonate", "{}", "{\"userId\":\"" + chosen.path("id").asText() + "\"}", "");
                return null;
            });
        } catch (RuntimeException exception) {
            sessions.destroy(issued.sessionId());
            throw exception;
        }
        return issued;
    }

    private JsonNode write(String phone, String id, String action, String reason, java.util.function.Function<ObjectNode, Change> mutate) {
        UUID pharmacyId = MasterLists.parse(id);
        return store.withState(pharmacyId, (state, connection) -> {
            Change change = mutate.apply(state);
            if (change == null) {
                return null;
            }
            audit(connection, phone, pharmacyId, action, change.before().toString(), change.after().toString(), reason);
            return change.after();
        });
    }

    private void audit(Connection connection, String phone, UUID pharmacyId, String action, String before, String after, String reason) {
        try (PreparedStatement statement = connection.prepareStatement(
                "INSERT INTO master_audit (phone, pharmacy_id, action, \"before\", \"after\", reason) VALUES (?,?,?,?::jsonb,?::jsonb,?)")) {
            statement.setString(1, phone);
            statement.setObject(2, pharmacyId);
            statement.setString(3, action);
            statement.setString(4, before);
            statement.setString(5, after);
            statement.setString(6, reason == null ? "" : reason);
            statement.executeUpdate();
        } catch (SQLException exception) {
            if ("P0001".equals(exception.getSQLState())) {
                throw new ApiError(500, "VALIDATION", "The audit record could not be saved");
            }
            throw new IllegalStateException(exception);
        }
    }

    private static void markRequests(ObjectNode state) {
        for (JsonNode node : state.withArray("subscriptionRequests")) {
            if (node instanceof ObjectNode request && "open".equals(request.path("status").asText())) {
                request.put("status", "handled");
            }
        }
    }

    private static ObjectNode referral(ObjectNode state, String id) {
        ObjectNode previous = Nodes.findId(state.withArray("referrals"), id);
        if (previous == null) {
            throw new ApiError(404, "NOT_FOUND", "Referral not found");
        }
        return previous;
    }

    private static void assertExtra(String plan, int extra) {
        Integer included = Plans.includedSeats(plan);
        if (included == null) {
            if (extra > Plans.SEAT_CAP) {
                throw new ApiError(400, "VALIDATION", "Extra seats cannot exceed 50");
            }
            return;
        }
        if (included + extra > Plans.SEAT_CAP) {
            throw new ApiError(400, "VALIDATION", "Total seats cannot exceed 50");
        }
    }

    private static String requiredPlan(String value) {
        String plan = Plans.asPlan(value);
        if (plan == null) {
            throw new ApiError(400, "VALIDATION", "Choose a plan");
        }
        return plan;
    }

    private static String cycle(String value) {
        if ("monthly".equals(value) || "annual".equals(value)) {
            return value;
        }
        throw new ApiError(400, "VALIDATION", "Choose a billing cycle");
    }

    static String date(String value, String message) {
        if (value != null && value.matches("\\d{4}-\\d{2}-\\d{2}")) {
            return value;
        }
        throw new ApiError(400, "VALIDATION", message);
    }

    private record Change(JsonNode before, JsonNode after) {
    }
}
