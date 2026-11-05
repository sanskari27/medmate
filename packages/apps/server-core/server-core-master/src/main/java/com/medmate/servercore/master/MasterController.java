package com.medmate.servercore.master;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.identity.AuthCookies;
import com.medmate.servercore.identity.AuthService;
import com.medmate.servercore.identity.EnvNumbers;
import com.medmate.servercore.identity.SessionRow;
import com.medmate.servercore.kernel.ApiBodies;
import com.medmate.servercore.kernel.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class MasterController {
    private final MasterSessions sessions;
    private final AuthService auth;
    private final MasterLists lists;
    private final MasterWrites writes;
    private final CouponService coupons;
    private final ConsultationService consultations;

    public MasterController(MasterSessions sessions, AuthService auth, MasterLists lists, MasterWrites writes, CouponService coupons, ConsultationService consultations) {
        this.sessions = sessions;
        this.auth = auth;
        this.lists = lists;
        this.writes = writes;
        this.coupons = coupons;
        this.consultations = consultations;
    }

    @PostMapping("/consultations")
    public JsonNode book(@RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(consultations.book(body));
    }

    @PostMapping("/subscription/coupons/preview")
    public JsonNode preview(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(coupons.preview(requirePharmacy(request).pharmacyId(), body == null ? "" : body.path("code").asText()));
    }

    @PostMapping("/subscription/coupons/redeem")
    public JsonNode redeem(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(coupons.redeem(requirePharmacy(request).pharmacyId(), body == null ? "" : body.path("code").asText()));
    }

    @PostMapping("/master/sign-out")
    public JsonNode signOut(HttpServletRequest request, HttpServletResponse response) {
        sessions.destroySession(AuthCookies.read(request, AuthCookies.MASTER));
        AuthCookies.write(response, request, AuthCookies.MASTER, null, 0, "/", auth.production());
        return ApiBodies.encode(com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode().put("ok", true));
    }

    @GetMapping("/master/session")
    public JsonNode session(HttpServletRequest request) {
        return ApiBodies.encode(com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode().put("phone", master(request)));
    }

    @GetMapping("/master/pharmacies")
    public JsonNode pharmacies(HttpServletRequest request, @RequestParam(required = false) String q, @RequestParam(required = false) String plan,
                               @RequestParam(required = false) String businessType, @RequestParam(required = false) String window) {
        master(request);
        return ApiBodies.encode(lists.pharmacies(q, plan, businessType, window));
    }

    @GetMapping("/master/requests")
    public JsonNode requests(HttpServletRequest request) {
        master(request);
        return ApiBodies.encode(lists.requests());
    }

    @GetMapping("/master/work")
    public JsonNode work(HttpServletRequest request) {
        master(request);
        return ApiBodies.encode(lists.work());
    }

    @GetMapping("/master/audit")
    public JsonNode audit(HttpServletRequest request) {
        master(request);
        return ApiBodies.encode(lists.audit());
    }

    @GetMapping("/master/consultations")
    public JsonNode consultations(HttpServletRequest request) {
        master(request);
        return ApiBodies.encode(consultations.list());
    }

    @PatchMapping("/master/consultations/{id}")
    public JsonNode mark(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        master(request);
        return ApiBodies.encode(consultations.mark(id, body));
    }

    @GetMapping("/master/coupons")
    public JsonNode couponList(HttpServletRequest request) {
        master(request);
        return ApiBodies.encode(coupons.list());
    }

    @PostMapping("/master/coupons")
    public JsonNode issue(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(coupons.issue(master(request), body));
    }

    @GetMapping("/master/pharmacies/{id}")
    public JsonNode profile(HttpServletRequest request, @PathVariable String id) {
        master(request);
        return ApiBodies.encode(lists.profile(id));
    }

    @PatchMapping("/master/pharmacies/{id}/plan")
    public JsonNode plan(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(writes.plan(master(request), id, body));
    }

    @PutMapping("/master/pharmacies/{id}/grants")
    public JsonNode grants(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(writes.grants(master(request), id, body));
    }

    @PatchMapping("/master/pharmacies/{id}/seats")
    public JsonNode seats(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(writes.seats(master(request), id, body));
    }

    @PatchMapping("/master/pharmacies/{id}/business-type")
    public JsonNode kind(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(writes.businessType(master(request), id, body));
    }

    @PatchMapping("/master/pharmacies/{id}/tickets/{ticketId}")
    public JsonNode ticket(HttpServletRequest request, @PathVariable String id, @PathVariable String ticketId, @RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(writes.ticket(master(request), id, ticketId, body));
    }

    @PostMapping("/master/pharmacies/{id}/impersonate")
    public JsonNode impersonate(HttpServletRequest request, HttpServletResponse response, @PathVariable String id) {
        var issued = writes.impersonate(master(request), id);
        AuthCookies.write(response, request, AuthCookies.SESSION, issued.access(), EnvNumbers.accessTtl(), "/", auth.production());
        AuthCookies.write(response, request, AuthCookies.REFRESH, issued.refresh(), EnvNumbers.refreshTtl(), "/api/v1/auth", auth.production());
        return ApiBodies.encode(com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode().put("ok", true));
    }

    @PostMapping("/master/pharmacies/{id}/referrals/{referralId}/earn")
    public JsonNode earn(HttpServletRequest request, @PathVariable String id, @PathVariable String referralId, @RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(writes.earn(master(request), id, referralId, body));
    }

    @PostMapping("/master/pharmacies/{id}/referrals/{referralId}/pay")
    public JsonNode pay(HttpServletRequest request, @PathVariable String id, @PathVariable String referralId, @RequestBody(required = false) JsonNode body) {
        return ApiBodies.encode(writes.pay(master(request), id, referralId, body));
    }

    private SessionRow requirePharmacy(HttpServletRequest request) {
        SessionRow session = auth.session(AuthCookies.accessToken(request));
        if (session == null) {
            throw new ApiError(401, "UNAUTHENTICATED", "Sign in required");
        }
        return session;
    }

    private String master(HttpServletRequest request) {
        String token = AuthCookies.read(request, AuthCookies.MASTER);
        if (token == null || token.isBlank()) {
            if (auth.session(AuthCookies.accessToken(request)) != null) {
                throw new ApiError(403, "FORBIDDEN", "Master sign-in required");
            }
            throw new ApiError(401, "UNAUTHENTICATED", "Sign in required");
        }
        String phone = sessions.phone(token);
        if (phone == null) {
            throw new ApiError(401, "UNAUTHENTICATED", "Sign in required");
        }
        if (!sessions.isMasterPhone(phone)) {
            throw new ApiError(403, "FORBIDDEN", "This phone is no longer a master login");
        }
        return phone;
    }
}
