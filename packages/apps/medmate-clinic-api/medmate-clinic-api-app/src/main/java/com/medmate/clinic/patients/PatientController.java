package com.medmate.clinic.patients;

import com.medmate.clinic.error.ApiProblem;
import com.medmate.clinic.grants.GrantChecker;
import com.medmate.clinic.routing.ClinicRouting;
import com.medmate.clinic.security.ClinicPrincipal;
import com.medmate.clinic.security.ClinicTokenVerifier;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import javax.sql.DataSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PatientController {

    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_SIZE = 25;

    private final ClinicRouting routing;
    private final ClinicTokenVerifier verifier;

    public PatientController(ClinicRouting routing, ClinicTokenVerifier verifier) {
        this.routing = Objects.requireNonNull(routing, "routing");
        this.verifier = Objects.requireNonNull(verifier, "verifier");
    }

    @GetMapping("/clinic/patients")
    public Map<String, Object> list(
            @RequestHeader(name = "Authorization", required = false) String authorization,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean due,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String sort) {

        ClinicPrincipal principal = principal(authorization);
        DataSource dataSource = routing.route(principal);
        GrantChecker grants = new GrantChecker(dataSource);

        if (!grants.holds(principal, GrantChecker.PATIENTS_READ)) {
            throw new ApiProblem(HttpStatus.FORBIDDEN, "Forbidden", "This action is not allowed.");
        }

        int p = page == null ? DEFAULT_PAGE : page;
        int s = size == null ? DEFAULT_SIZE : size;

        PatientList patientList = new PatientList(dataSource, principal.clinicId());
        PatientList.PatientPage result = patientList.search(principal.clinicId(), q, status, due, p, s, sort);

        return body(result, grants, principal);
    }

    private ClinicPrincipal principal(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            throw new ApiProblem(HttpStatus.UNAUTHORIZED, "Unauthorized", "Session was not accepted");
        }
        return verifier.verify(authorization, Instant.now());
    }

    private Map<String, Object> body(PatientList.PatientPage result, GrantChecker grants, ClinicPrincipal principal) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (PatientList.PatientItem item : result.items()) {
            items.add(item(item, grants, principal));
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", items);
        body.put("page", result.page());
        body.put("size", result.size());
        body.put("total", result.total());
        return body;
    }

    private Map<String, Object> item(PatientList.PatientItem item, GrantChecker grants, ClinicPrincipal principal) {
        Map<String, Object> o = new LinkedHashMap<>();
        o.put("id", item.id());
        o.put("name", item.name());
        o.put("age", item.age());
        o.put("sex", item.sex());
        o.put("phone", mask(item.phone()));
        o.put("status", item.status());
        if (grants.holds(principal, GrantChecker.BILLING_READ)) {
            o.put("due", item.due());
        }
        if (grants.holds(principal, GrantChecker.PATIENTS_READ_CLINICAL)) {
            o.put("conditions", item.conditions());
            o.put("allergies", item.allergies());
            o.put("abha", item.abha());
            o.put("lastSeen", item.lastSeen());
        }
        return o;
    }

    private String mask(String phone) {
        if (phone == null || phone.isBlank()) {
            return phone;
        }
        int reveal = 4;
        StringBuilder masked = new StringBuilder();
        for (int i = 0; i < phone.length() - reveal; i++) {
            masked.append('\u2022');
        }
        masked.append(' ');
        masked.append(phone.substring(phone.length() - reveal));
        return masked.toString();
    }
}
