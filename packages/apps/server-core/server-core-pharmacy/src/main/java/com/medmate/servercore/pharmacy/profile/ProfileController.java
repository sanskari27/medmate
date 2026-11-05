package com.medmate.servercore.pharmacy.profile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.kernel.EmptyPharmacy;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ProfileController {
    private final PharmacyGateway gateway;
    private final ProfileService profiles;
    private final com.fasterxml.jackson.databind.ObjectMapper mapper;

    public ProfileController(PharmacyGateway gateway, ProfileService profiles, com.fasterxml.jackson.databind.ObjectMapper mapper) {
        this.gateway = gateway;
        this.profiles = profiles;
        this.mapper = mapper;
    }

    @GetMapping("/pharmacy/profile")
    public JsonNode profile(HttpServletRequest request) {
        return gateway.read(request, null, null, false, (state, session) -> state.get("profile"));
    }

    @PatchMapping("/pharmacy/profile")
    public JsonNode patch(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> profiles.patchProfile(state, body));
    }

    @PostMapping("/pharmacy/store-open")
    public JsonNode store(HttpServletRequest request) {
        return gateway.write(request, null, null, false, (state, session) -> profiles.toggleStore(state));
    }

    @GetMapping("/settings/invoice")
    public JsonNode invoice(HttpServletRequest request) {
        return gateway.read(request, null, null, false, (state, session) -> state.get("invoiceSettings"));
    }

    @PatchMapping("/settings/invoice")
    public JsonNode patchInvoice(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, null, null, false, (state, session) -> profiles.patchInvoice(state, body));
    }

    @GetMapping("/settings/kiosk")
    public JsonNode kiosk(HttpServletRequest request) {
        return gateway.read(request, "kiosk", null, false, (state, session) -> state.get("kiosk"));
    }

    @PatchMapping("/settings/kiosk")
    public JsonNode patchKiosk(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "kiosk", null, false, (state, session) -> profiles.patchKiosk(state, body));
    }

    @PostMapping("/setup/complete")
    public JsonNode complete(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        boolean complete = body == null || !body.has("complete") || body.path("complete").asBoolean(true);
        return gateway.write(request, null, null, false, (state, session) -> profiles.completeSetup(state, complete));
    }

    @PostMapping("/setup/wipe")
    public JsonNode wipe(HttpServletRequest request) {
        return gateway.write(request, null, null, false, (state, session) -> profiles.wipe());
    }

    @PostMapping("/demo/reset")
    public JsonNode reset(HttpServletRequest request) {
        if (gateway.auth().production()) {
            throw new ApiError(404, "NOT_FOUND", "No such API");
        }
        return gateway.write(request, null, null, false, (state, session) -> {
            ObjectNode next = EmptyPharmacy.create(mapper, state.path("profile").path("name").asText(), session.phone(), state.path("businessType").asText());
            ObjectNode me = null;
            for (JsonNode user : state.withArray("users")) {
                if (session.userId().equals(user.path("id").asText()) && user instanceof ObjectNode object) {
                    me = object.deepCopy();
                }
            }
            if (me != null) {
                me.put("phone", session.phone());
                next.putArray("users").add(me);
            }
            state.removeAll();
            next.fields().forEachRemaining(entry -> state.set(entry.getKey(), entry.getValue()));
            return mapper.createObjectNode().put("ok", true);
        });
    }
}
