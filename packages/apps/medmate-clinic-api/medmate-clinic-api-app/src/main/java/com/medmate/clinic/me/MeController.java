package com.medmate.clinic.me;

import com.medmate.clinic.error.ApiProblem;
import com.medmate.clinic.grants.GrantChecker;
import com.medmate.clinic.routing.ClinicDataSourceFactory;
import com.medmate.clinic.routing.ClinicRegistry;
import com.medmate.clinic.routing.ClinicRegistryRow;
import com.medmate.clinic.routing.ClinicUnavailableException;
import com.medmate.clinic.security.ClinicPrincipal;
import com.medmate.clinic.security.ClinicTokenVerifier;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import javax.sql.DataSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MeController {

    private final ClinicRegistry registry;
    private final ClinicDataSourceFactory dataSourceFactory;
    private final ClinicTokenVerifier verifier;

    public MeController(
            ClinicRegistry registry, ClinicDataSourceFactory dataSourceFactory, ClinicTokenVerifier verifier) {
        this.registry = Objects.requireNonNull(registry, "registry");
        this.dataSourceFactory = Objects.requireNonNull(dataSourceFactory, "dataSourceFactory");
        this.verifier = Objects.requireNonNull(verifier, "verifier");
    }

    @GetMapping("/clinic/me")
    public Map<String, Object> me(@RequestHeader(name = "Authorization") String authorization) {
        ClinicPrincipal principal = principal(authorization);
        ClinicRegistryRow row = registry.find(principal.clinicId()).orElseThrow(ClinicUnavailableException::new);
        DataSource dataSource = dataSourceFactory.create(row, principal);
        GrantChecker grants = new GrantChecker(dataSource);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("clinicId", principal.clinicId());
        body.put("clinicName", row.displayName());
        body.put("role", principal.clinicRole());
        body.put("grants", grants.grants(principal));
        return body;
    }

    private ClinicPrincipal principal(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            throw new ApiProblem(HttpStatus.UNAUTHORIZED, "Unauthorized", "Session was not accepted");
        }
        return verifier.verify(authorization, Instant.now());
    }
}
