package com.medmate.servercore.pharmacy.hospital;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.servercore.kernel.ApiError;
import com.medmate.servercore.pharmacy.store.AccessGuard;
import com.medmate.servercore.pharmacy.store.PharmacyGateway;
import com.medmate.servercore.identity.SessionRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hospital")
public class HospitalController {
    private final PharmacyGateway gateway;
    private final HospitalAdmissionService admissions;
    private final HospitalDirectoryService directory;
    private final HospitalBillingService billing;
    private final PatientLedgerService ledger;
    private final SessionRepository sessions;

    public HospitalController(PharmacyGateway gateway, HospitalAdmissionService admissions, HospitalDirectoryService directory,
                              HospitalBillingService billing, PatientLedgerService ledger, SessionRepository sessions) {
        this.gateway = gateway;
        this.admissions = admissions;
        this.directory = directory;
        this.billing = billing;
        this.ledger = ledger;
        this.sessions = sessions;
    }

    @GetMapping("/wards")
    public JsonNode wards(HttpServletRequest request) {
        return gateway.read(request, "wards", null, true, (state, session) -> state.get("wards"));
    }

    @PostMapping("/wards")
    public JsonNode addWard(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "wards", null, true, (state, session) -> admissions.addWard(state, body));
    }

    @PatchMapping("/wards/{id}")
    public JsonNode updateWard(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "wards", null, true, (state, session) -> admissions.updateWard(state, id, body));
    }

    @GetMapping("/admissions")
    public JsonNode admissions(HttpServletRequest request) {
        return gateway.read(request, "wards", null, true, (state, session) -> state.get("admissions"));
    }

    @PostMapping("/admissions")
    public JsonNode admit(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "wards", null, true, (state, session) -> admissions.admit(state, body));
    }

    @PatchMapping("/admissions/{id}")
    public JsonNode patchAdmission(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "wards", null, true, (state, session) -> "discharged".equals(body.path("status").asText()) ? admissions.discharge(state, id) : admissions.updateAdmission(state, id, body));
    }

    @GetMapping("/indents")
    public JsonNode indents(HttpServletRequest request) {
        return gateway.read(request, "indents", null, true, (state, session) -> state.get("wardIndents"));
    }

    @PatchMapping("/indents/{id}")
    public JsonNode indent(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "indents", null, true, (state, session) -> admissions.setIndentStatus(state, id, body.path("status").asText()));
    }

    @PostMapping("/indents/{id}/issue")
    public ResponseEntity<JsonNode> issueIndent(HttpServletRequest request, @PathVariable String id) {
        return gateway.idempotent(request, "indents", null, true, (state, session) -> billing.issueIndent(state, id));
    }

    @GetMapping("/departments")
    public JsonNode departments(HttpServletRequest request) {
        return gateway.read(request, "departments", null, true, (state, session) -> state.has("departments") ? state.get("departments") : state.arrayNode());
    }

    @PostMapping("/departments")
    public JsonNode addDepartment(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "departments", null, true, (state, session) -> directory.addDepartment(state, body));
    }

    @PatchMapping("/departments/{id}")
    public JsonNode updateDepartment(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "departments", null, true, (state, session) -> directory.updateDepartment(state, id, body));
    }

    @GetMapping("/doctors")
    public JsonNode doctors(HttpServletRequest request) {
        return gateway.read(request, "doctors", null, true, (state, session) -> state.get("doctors"));
    }

    @PostMapping("/doctors")
    public JsonNode addDoctor(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "doctors", null, true, (state, session) -> directory.addDoctor(state, body));
    }

    @PatchMapping("/doctors/{id}")
    public JsonNode updateDoctor(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "doctors", null, true, (state, session) -> directory.updateDoctor(state, id, body));
    }

    @GetMapping("/account")
    public JsonNode account(HttpServletRequest request) {
        return gateway.read(request, "hospbill", null, true, (state, session) -> state.get("hospitalAccount"));
    }

    @PatchMapping("/account")
    public JsonNode patchAccount(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "hospbill", null, true, (state, session) -> admissions.patchAccount(state, body));
    }

    @PatchMapping("/pricing/rules")
    public JsonNode pricing(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        boolean unlocked = "1".equals(request.getHeader("x-pricing-unlock"));
        return gateway.write(request, "hospbill", null, true, (state, session) -> {
            boolean allowed = session.pricingUnlocked() && unlocked;
            if (body != null && body.has("discountPct")) {
                return billing.setUniformDiscount(state, body.path("discountPct").asDouble(), allowed);
            }
            return billing.setPriceRule(state, body.path("productId").asText(), body.get("rule"), allowed);
        });
    }

    @PostMapping("/pricing/unlock")
    public JsonNode unlock(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        var session = gateway.require(request);
        var state = gateway.store().load(session.pharmacyId());
        AccessGuard.requireHospital(state);
        String code = body == null ? "" : body.path("code").asText(body.path("otp").asText(""));
        if (!billing.checkOtp(session.pricingPin(), code, !gateway.auth().production())) {
            throw new ApiError(401, "UNAUTHENTICATED", "Incorrect admin OTP", "otp");
        }
        sessions.setUnlocked(session.token(), true);
        return com.medmate.servercore.kernel.ApiBodies.encode(com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode().put("ok", true));
    }

    @PostMapping("/ward-supplies/issue")
    public ResponseEntity<JsonNode> issue(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.idempotent(request, "hospbill", null, true, (state, session) -> billing.issueSupply(state, body));
    }

    @PostMapping("/ward-supplies/return")
    public ResponseEntity<JsonNode> returned(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.idempotent(request, "hospbill", null, true, (state, session) -> billing.returnSupply(state, body));
    }

    @PostMapping("/payments")
    public ResponseEntity<JsonNode> payment(HttpServletRequest request, @RequestBody(required = false) JsonNode body) {
        return gateway.idempotent(request, "hospbill", null, true, (state, session) -> billing.recordPayment(state, body));
    }

    @GetMapping("/patient-bills")
    public JsonNode bills(HttpServletRequest request) {
        return gateway.read(request, "ptbills", null, true, (state, session) -> ledger.ledger(state));
    }

    @GetMapping("/tpa-claims/{id}")
    public JsonNode claim(HttpServletRequest request, @PathVariable String id) {
        return gateway.read(request, "hospbill", null, true, (state, session) -> {
            var found = com.medmate.servercore.kernel.Nodes.findId(state.withArray("tpaClaims"), id);
            if (found == null) {
                throw new ApiError(404, "NOT_FOUND", "Claim not found");
            }
            return found;
        });
    }

    @PatchMapping("/tpa-claims/{id}")
    public JsonNode patchClaim(HttpServletRequest request, @PathVariable String id, @RequestBody(required = false) JsonNode body) {
        return gateway.write(request, "hospbill", null, true, (state, session) -> directory.setClaim(state, id, body.path("status").asText(), body.get("approvedAmount")));
    }
}
