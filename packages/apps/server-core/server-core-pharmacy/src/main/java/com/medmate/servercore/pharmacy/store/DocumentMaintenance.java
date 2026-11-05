package com.medmate.servercore.pharmacy.store;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.EmptyPharmacy;
import com.medmate.servercore.kernel.MoneyCodec;
import com.medmate.servercore.kernel.Nodes;
import com.medmate.servercore.kernel.Plans;
import java.util.HashSet;
import java.util.Set;

public final class DocumentMaintenance {
    private DocumentMaintenance() {
    }

    public static void touch(ObjectNode state) {
        if (!state.has("grants") || state.get("grants").isNull()) {
            state.putArray("grants");
        }
        if (!state.has("extraSeats") || state.get("extraSeats").isNull()) {
            state.put("extraSeats", 0);
        }
        if (!state.has("subscriptionRequests") || state.get("subscriptionRequests").isNull()) {
            state.putArray("subscriptionRequests");
        }
        if (!state.has("referrals") || state.get("referrals").isNull()) {
            state.putArray("referrals");
        }
        JsonNode redeemed = state.get("couponRedeemed");
        state.put("couponRedeemed", redeemed != null && redeemed.isBoolean() && redeemed.booleanValue());
        ObjectNode subscription = Nodes.object(state, "subscription");
        if (subscription != null) {
            String plan = Plans.asPlan(subscription.path("plan").asText(null));
            if (plan != null && !plan.equals(subscription.path("plan").asText())) {
                subscription.put("plan", plan);
            }
        }
        var requests = Nodes.array(state, "subscriptionRequests");
        if (requests != null) {
            for (JsonNode request : requests) {
                if (request instanceof ObjectNode row) {
                    String plan = Plans.asPlan(row.path("plan").asText(null));
                    if (plan != null && !plan.equals(row.path("plan").asText())) {
                        row.put("plan", plan);
                    }
                }
            }
        }
    }

    public static boolean stripDemo(ObjectMapper mapper, ObjectNode state, boolean production) {
        if (!production) {
            return false;
        }
        boolean changed = false;
        ObjectNode invoice = Nodes.object(state, "invoiceSettings");
        if (invoice != null && EmptyPharmacy.PLACEHOLDER_BANK.equals(invoice.path("bankLine").asText())) {
            invoice.put("bankLine", "");
            changed = true;
        }
        if (!demoStore(state)) {
            return changed;
        }
        ObjectNode owner = null;
        var users = Nodes.array(state, "users");
        if (users != null) {
            for (JsonNode user : users) {
                if ("Owner".equals(user.path("role").asText())) {
                    owner = (ObjectNode) user;
                    break;
                }
            }
            if (owner == null && !users.isEmpty() && users.get(0) instanceof ObjectNode first) {
                owner = first;
            }
        }
        String phone = owner == null ? "" : owner.path("phone").asText("");
        if (phone.isBlank()) {
            phone = state.path("profile").path("phone").asText("");
        }
        ObjectNode next = EmptyPharmacy.create(mapper, null, phone, state.path("businessType").asText("pharmacy"));
        ObjectNode kept = next.withArray("users").addObject();
        kept.put("id", "u1");
        String ownerName = owner == null ? "Owner" : owner.path("name").asText("Owner");
        kept.put("name", "Rajesh Kumar".equals(ownerName) ? "Owner" : ownerName);
        kept.put("role", "Owner");
        kept.put("phone", phone);
        kept.put("email", "");
        kept.put("active", true);
        kept.put("lastActiveMins", 0);
        kept.put("pin", "");
        Set<String> keys = new HashSet<>();
        state.fieldNames().forEachRemaining(keys::add);
        keys.forEach(state::remove);
        next.fields().forEachRemaining(entry -> state.set(entry.getKey(), entry.getValue()));
        return true;
    }

    private static boolean demoStore(ObjectNode state) {
        boolean sale = false;
        var sales = Nodes.array(state, "sales");
        if (sales != null) {
            for (JsonNode row : sales) {
                if ("INV-2601".equals(row.path("id").asText())) {
                    sale = true;
                }
            }
        }
        boolean stock = false;
        var inventory = Nodes.array(state, "inventory");
        if (inventory != null) {
            for (JsonNode row : inventory) {
                if ("p1".equals(row.path("id").asText()) && "Dolo 650".equals(row.path("name").asText())) {
                    stock = true;
                }
            }
        }
        boolean people = "29ABCDE1234F1Z2".equals(state.path("profile").path("gstin").asText());
        var users = Nodes.array(state, "users");
        if (users != null) {
            for (JsonNode row : users) {
                if ("Rajesh@2481".equals(row.path("password").asText())) {
                    people = true;
                }
            }
        }
        return sale && stock && people;
    }
}
