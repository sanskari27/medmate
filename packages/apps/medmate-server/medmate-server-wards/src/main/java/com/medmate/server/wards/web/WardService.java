package com.medmate.server.wards.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.store.PharmacyStore;
import com.medmate.server.shared.error.ApiProblem;
import com.medmate.server.wards.WardRules;
import com.medmate.server.wards.store.WardStore;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class WardService {

    private static final String HOSPITAL_ONLY = "Wards are only available for a hospital";

    private final WardStore wards;
    private final PharmacyStore pharmacies;
    private final Clock clock;

    @Autowired
    public WardService(WardStore wards, PharmacyStore pharmacies) {
        this(wards, pharmacies, Clock.systemUTC());
    }

    WardService(WardStore wards, PharmacyStore pharmacies, Clock clock) {
        this.wards = wards;
        this.pharmacies = pharmacies;
        this.clock = clock;
    }

    public WardViews.WardList listWards(AccountPrincipal actor) {
        require(actor, WardRules.READ, "Wards cannot be read");
        return new WardViews.WardList(wardViews(wards.listWards(actor.pharmacyId())));
    }

    public WardViews.WardOne oneWard(AccountPrincipal actor, UUID id) {
        require(actor, WardRules.READ, "Wards cannot be read");
        return new WardViews.WardOne(wardView(loadWard(actor.pharmacyId(), id)));
    }

    @Transactional
    public WardViews.WardOne createWard(AccountPrincipal actor, JsonNode body) {
        require(actor, WardRules.CREATE, "Wards cannot be created");
        WardRules.Prepared prepared = WardRules.prepareCreate(body);
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        lock(actor.pharmacyId());
        if (wards.codeTaken(
                actor.pharmacyId(), WardRules.codeKey(prepared.values().code()), null)) {
            throw codeTaken();
        }
        UUID id = UUID.randomUUID();
        try {
            wards.insertWard(id, actor.pharmacyId(), prepared.values());
        } catch (DataIntegrityViolationException exception) {
            throw codeTaken();
        }
        return new WardViews.WardOne(wardView(loadWard(actor.pharmacyId(), id)));
    }

    @Transactional
    public WardViews.WardOne updateWard(AccountPrincipal actor, UUID id, JsonNode body) {
        require(actor, WardRules.UPDATE, "Wards cannot be updated");
        WardStore.WardRow current = loadWard(actor.pharmacyId(), id);
        WardRules.Prepared prepared = WardRules.prepareUpdate(body, values(current));
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        lock(actor.pharmacyId());
        if (wards.codeTaken(
                actor.pharmacyId(), WardRules.codeKey(prepared.values().code()), id)) {
            throw codeTaken();
        }
        String capacity = WardRules.capacityProblem(
                prepared.values().beds(), prepared.values().bedsHeld(), wards.occupiedNumbers(actor.pharmacyId(), id));
        if (capacity != null) {
            throw bad(capacity);
        }
        try {
            wards.updateWard(id, actor.pharmacyId(), prepared.values());
        } catch (DataIntegrityViolationException exception) {
            throw codeTaken();
        }
        if (!current.code().equals(prepared.values().code())) {
            wards.rewriteBeds(actor.pharmacyId(), id, prepared.values().code());
        }
        return new WardViews.WardOne(wardView(loadWard(actor.pharmacyId(), id)));
    }

    public WardViews.AdmissionList listAdmissions(AccountPrincipal actor) {
        require(actor, WardRules.READ, "Wards cannot be read");
        Instant now = clock.instant();
        List<WardViews.AdmissionView> views = new ArrayList<>();
        for (WardStore.AdmissionRow row : wards.listAdmissions(actor.pharmacyId())) {
            views.add(admissionView(row, now));
        }
        return new WardViews.AdmissionList(views);
    }

    public WardViews.AdmissionOne oneAdmission(AccountPrincipal actor, UUID id) {
        require(actor, WardRules.READ, "Wards cannot be read");
        return new WardViews.AdmissionOne(admissionView(loadAdmission(actor.pharmacyId(), id), clock.instant()));
    }

    @Transactional
    public WardViews.AdmissionOne admit(AccountPrincipal actor, JsonNode body) {
        require(actor, WardRules.ADMIT, "A patient cannot be admitted");
        WardRules.PreparedAdmission prepared = WardRules.prepareAdmit(body);
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        lock(actor.pharmacyId());
        WardStore.WardRow ward = wards.findWard(
                        actor.pharmacyId(), prepared.values().wardId())
                .orElseThrow(() -> bad("Ward was not found"));
        Integer number = WardRules.bedNumber(ward.code(), prepared.values().bed());
        if (number == null) {
            throw bad("Bed is not free");
        }
        String assign = WardRules.assignProblem(
                ward.beds(),
                ward.bedsHeld(),
                number,
                wards.bedTaken(actor.pharmacyId(), ward.id(), number, null),
                ward.underMaintenance());
        if (assign != null) {
            throw bad(assign);
        }
        if (wards.uhidTaken(
                actor.pharmacyId(), WardRules.uhidKey(prepared.values().uhid()))) {
            throw admitted();
        }
        UUID id = UUID.randomUUID();
        try {
            wards.insertAdmission(
                    id,
                    actor.pharmacyId(),
                    prepared.values(),
                    number,
                    WardRules.bedLabel(ward.code(), number),
                    clock.instant());
        } catch (DataIntegrityViolationException exception) {
            throw admitted();
        }
        return new WardViews.AdmissionOne(admissionView(loadAdmission(actor.pharmacyId(), id), clock.instant()));
    }

    @Transactional
    public WardViews.AdmissionOne transfer(AccountPrincipal actor, UUID id, JsonNode body) {
        require(actor, WardRules.TRANSFER, "A patient cannot be transferred");
        if (body == null || !body.isObject()) {
            throw bad("Ward was not found");
        }
        lock(actor.pharmacyId());
        WardStore.AdmissionRow current = loadAdmission(actor.pharmacyId(), id);
        if (!"admitted".equals(current.status())) {
            throw bad("This patient is already discharged");
        }
        UUID wardId = wardId(body);
        if (wardId == null) {
            throw bad("Ward was not found");
        }
        if (text(body, "bed").isEmpty()) {
            throw bad("Bed is required");
        }
        WardStore.WardRow ward =
                wards.findWard(actor.pharmacyId(), wardId).orElseThrow(() -> bad("Ward was not found"));
        Integer number = WardRules.bedNumber(ward.code(), text(body, "bed"));
        if (number == null) {
            throw bad("Bed is not free");
        }
        boolean sameBed = ward.id().equals(current.wardId()) && number == current.bedNumber();
        if (!sameBed) {
            String assign = WardRules.assignProblem(
                    ward.beds(),
                    ward.bedsHeld(),
                    number,
                    wards.bedTaken(actor.pharmacyId(), ward.id(), number, id),
                    ward.underMaintenance() && !ward.id().equals(current.wardId()));
            if (assign != null) {
                throw bad(assign);
            }
            wards.moveAdmission(id, actor.pharmacyId(), ward.id(), WardRules.bedLabel(ward.code(), number), number);
        }
        return new WardViews.AdmissionOne(admissionView(loadAdmission(actor.pharmacyId(), id), clock.instant()));
    }

    @Transactional
    public WardViews.AdmissionOne discharge(AccountPrincipal actor, UUID id, JsonNode body) {
        require(actor, WardRules.DISCHARGE, "A patient cannot be discharged");
        String modeProblem = WardRules.payModeProblem(body);
        if (modeProblem != null) {
            throw bad(modeProblem);
        }
        lock(actor.pharmacyId());
        WardStore.AdmissionRow current = loadAdmission(actor.pharmacyId(), id);
        if (!"admitted".equals(current.status())) {
            throw bad("This patient is already discharged");
        }
        Instant now = clock.instant();
        int days = WardRules.days(current.admittedAt(), now);
        BigDecimal amount = WardRules.charge(current.dailyRate(), days);
        String mode = WardRules.payMode(body);
        if (amount.signum() > 0 && mode == null) {
            throw bad("Pay mode is required");
        }
        if (amount.signum() == 0) {
            mode = null;
        }
        wards.discharge(id, actor.pharmacyId(), now, amount, mode, current.dailyRate());
        return new WardViews.AdmissionOne(admissionView(loadAdmission(actor.pharmacyId(), id), now));
    }

    private WardStore.WardRow loadWard(UUID pharmacyId, UUID id) {
        return wards.findWard(pharmacyId, id).orElseThrow(WardService::missingWard);
    }

    private WardStore.AdmissionRow loadAdmission(UUID pharmacyId, UUID id) {
        return wards.findAdmission(pharmacyId, id).orElseThrow(WardService::missingAdmission);
    }

    private void lock(UUID pharmacyId) {
        if (!wards.lockPharmacy(pharmacyId)) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
    }

    private List<WardViews.WardView> wardViews(List<WardStore.WardRow> rows) {
        List<WardViews.WardView> views = new ArrayList<>();
        for (WardStore.WardRow row : rows) {
            views.add(wardView(row));
        }
        return views;
    }

    private static WardViews.WardView wardView(WardStore.WardRow row) {
        return new WardViews.WardView(
                row.id(),
                row.name(),
                row.code(),
                row.floor(),
                row.category(),
                row.beds(),
                row.sister(),
                WardRules.moneyText(row.dailyRate()),
                row.bedsHeld(),
                row.underMaintenance(),
                row.maintenanceNote());
    }

    private static WardViews.AdmissionView admissionView(WardStore.AdmissionRow row, Instant now) {
        boolean open = "admitted".equals(row.status());
        int days = WardRules.days(row.admittedAt(), open ? now : row.dischargedAt());
        BigDecimal rate = open ? row.dailyRate() : row.rateUsed();
        BigDecimal outstanding = open ? WardRules.charge(rate, days) : row.settledAmount();
        return new WardViews.AdmissionView(
                row.id(),
                row.name(),
                row.uhid(),
                row.phone(),
                row.age(),
                row.gender(),
                row.wardId(),
                row.wardName(),
                row.bed(),
                row.doctor(),
                row.diagnosis(),
                row.payerType(),
                row.insurer(),
                row.policyNo(),
                row.admittedAt().toString(),
                row.status(),
                days,
                WardRules.moneyText(rate),
                WardRules.moneyText(outstanding));
    }

    private static WardRules.WardValues values(WardStore.WardRow row) {
        return new WardRules.WardValues(
                row.name(),
                row.code(),
                row.floor(),
                row.category(),
                row.beds(),
                row.sister(),
                row.dailyRate(),
                row.bedsHeld(),
                row.underMaintenance(),
                row.maintenanceNote());
    }

    private void require(AccountPrincipal actor, String key, String detail) {
        if (!Access.pharmacyMember(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus())) {
            throw forbidden(detail);
        }
        PharmacyStore.PharmacyRow pharmacy = pharmacies
                .findById(actor.pharmacyId())
                .orElseThrow(() -> new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found"));
        if (!"hospital".equals(pharmacy.pharmacyType())) {
            throw forbidden(HOSPITAL_ONLY);
        }
        if (!Access.pharmacy(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus(),
                actor.permissions(),
                key)) {
            throw forbidden(detail);
        }
    }

    private static UUID wardId(JsonNode body) {
        if (body == null || !body.has("wardId") || body.get("wardId").isNull()) {
            return null;
        }
        try {
            return UUID.fromString(body.get("wardId").asText("").trim());
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private static String text(JsonNode body, String field) {
        if (body == null || !body.has(field) || body.get(field).isNull()) {
            return "";
        }
        return body.get(field).asText("").trim();
    }

    private static ApiProblem missingWard() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Ward was not found");
    }

    private static ApiProblem missingAdmission() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Admission was not found");
    }

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem forbidden(String detail) {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }

    private static ApiProblem codeTaken() {
        return new ApiProblem(HttpStatus.CONFLICT, "Conflict", "Ward code is already in use");
    }

    private static ApiProblem admitted() {
        return new ApiProblem(HttpStatus.CONFLICT, "Conflict", "This patient is already admitted");
    }
}
