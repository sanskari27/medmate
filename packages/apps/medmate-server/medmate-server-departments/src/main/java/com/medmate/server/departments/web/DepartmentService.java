package com.medmate.server.departments.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.medmate.server.departments.DepartmentRules;
import com.medmate.server.departments.store.DepartmentStore;
import com.medmate.server.identity.access.Access;
import com.medmate.server.identity.access.AccountPrincipal;
import com.medmate.server.identity.store.PharmacyStore;
import com.medmate.server.shared.error.ApiProblem;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile({"local", "prod", "identity-it"})
public class DepartmentService {

    private static final String HOSPITAL_ONLY = "Departments are only available for a hospital";

    private final DepartmentStore departments;
    private final PharmacyStore pharmacies;

    public DepartmentService(DepartmentStore departments, PharmacyStore pharmacies) {
        this.departments = departments;
        this.pharmacies = pharmacies;
    }

    public DepartmentViews.ListResponse list(AccountPrincipal actor) {
        requireListed(actor);
        return new DepartmentViews.ListResponse(views(departments.list(actor.pharmacyId())));
    }

    public DepartmentViews.OneResponse one(AccountPrincipal actor, UUID id) {
        require(actor, DepartmentRules.READ, "Departments cannot be read");
        return response(actor.pharmacyId(), id);
    }

    @Transactional
    public DepartmentViews.OneResponse create(AccountPrincipal actor, JsonNode body) {
        require(actor, DepartmentRules.CREATE, "Departments cannot be created");
        DepartmentRules.Prepared prepared = DepartmentRules.prepareCreate(body);
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        if (!departments.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        if (departments.codeTaken(
                actor.pharmacyId(), DepartmentRules.codeKey(prepared.values().code()), null)) {
            throw conflict();
        }
        UUID id = UUID.randomUUID();
        ensureParent(actor.pharmacyId(), id, prepared.values().parentId());
        departments.insert(id, actor.pharmacyId(), prepared.values());
        return response(actor.pharmacyId(), id);
    }

    @Transactional
    public DepartmentViews.OneResponse update(AccountPrincipal actor, UUID id, JsonNode body) {
        require(actor, DepartmentRules.UPDATE, "Departments cannot be updated");
        DepartmentStore.DepartmentRow current =
                departments.find(actor.pharmacyId(), id).orElseThrow(DepartmentService::missing);
        DepartmentRules.Prepared prepared = DepartmentRules.prepareUpdate(body, values(current));
        if (prepared.problem() != null) {
            throw bad(prepared.problem());
        }
        if (!departments.lockPharmacy(actor.pharmacyId())) {
            throw new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Pharmacy was not found");
        }
        if (departments.codeTaken(
                actor.pharmacyId(), DepartmentRules.codeKey(prepared.values().code()), id)) {
            throw conflict();
        }
        ensureParent(actor.pharmacyId(), id, prepared.values().parentId());
        departments.update(id, actor.pharmacyId(), prepared.values());
        return response(actor.pharmacyId(), id);
    }

    private void ensureParent(UUID pharmacyId, UUID self, UUID parentId) {
        Map<UUID, UUID> parents = new HashMap<>();
        for (DepartmentStore.DepartmentRow row : departments.list(pharmacyId)) {
            parents.put(row.id(), row.parentId());
        }
        if (parentId != null && !parents.containsKey(parentId)) {
            throw bad("Parent department was not found");
        }
        if (DepartmentRules.cycle(self, parentId, parents)) {
            throw bad("Department cycle is not allowed");
        }
    }

    private List<DepartmentViews.DepartmentView> views(List<DepartmentStore.DepartmentRow> rows) {
        Map<UUID, DepartmentStore.DepartmentRow> byId = new HashMap<>();
        for (DepartmentStore.DepartmentRow row : rows) {
            byId.put(row.id(), row);
        }
        List<DepartmentViews.DepartmentView> views = new ArrayList<>();
        for (DepartmentStore.DepartmentRow row : rows) {
            views.add(view(row, parentView(byId.get(row.parentId()))));
        }
        return views;
    }

    private DepartmentViews.OneResponse response(UUID pharmacyId, UUID id) {
        DepartmentStore.DepartmentRow row = departments.find(pharmacyId, id).orElseThrow(DepartmentService::missing);
        return new DepartmentViews.OneResponse(view(row, parentOf(pharmacyId, row)));
    }

    private DepartmentViews.Parent parentOf(UUID pharmacyId, DepartmentStore.DepartmentRow row) {
        if (row.parentId() == null) {
            return null;
        }
        return parentView(departments.find(pharmacyId, row.parentId()).orElse(null));
    }

    private static DepartmentViews.Parent parentView(DepartmentStore.DepartmentRow parent) {
        if (parent == null) {
            return null;
        }
        return new DepartmentViews.Parent(parent.id(), parent.name(), parent.code());
    }

    private static DepartmentViews.DepartmentView view(
            DepartmentStore.DepartmentRow row, DepartmentViews.Parent parent) {
        return new DepartmentViews.DepartmentView(
                row.id(), row.name(), row.code(), row.description(), row.active(), row.displayOrder(), parent);
    }

    private static DepartmentRules.Values values(DepartmentStore.DepartmentRow row) {
        return new DepartmentRules.Values(
                row.name(), row.code(), row.description(), row.parentId(), row.active(), row.displayOrder());
    }

    private void requireListed(AccountPrincipal actor) {
        requireHospital(actor, "Departments cannot be read");
        if (allows(actor, DepartmentRules.READ)
                || allows(actor, DepartmentRules.DOCTORS_CREATE)
                || allows(actor, DepartmentRules.DOCTORS_UPDATE)) {
            return;
        }
        throw forbidden("Departments cannot be read");
    }

    private void require(AccountPrincipal actor, String key, String detail) {
        requireHospital(actor, detail);
        if (!allows(actor, key)) {
            throw forbidden(detail);
        }
    }

    private void requireHospital(AccountPrincipal actor, String detail) {
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
    }

    private static boolean allows(AccountPrincipal actor, String key) {
        return Access.pharmacy(
                actor.accountType(),
                actor.disabled(),
                actor.pharmacyRole(),
                actor.pharmacyId(),
                actor.pharmacyId(),
                actor.verificationStatus(),
                actor.permissions(),
                key);
    }

    private static ApiProblem missing() {
        return new ApiProblem(HttpStatus.NOT_FOUND, "Not found", "Department was not found");
    }

    private static ApiProblem bad(String detail) {
        return new ApiProblem(HttpStatus.BAD_REQUEST, "Bad request", detail);
    }

    private static ApiProblem forbidden(String detail) {
        return new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", detail);
    }

    private static ApiProblem conflict() {
        return new ApiProblem(HttpStatus.CONFLICT, "Conflict", "Department code is already in use");
    }
}
