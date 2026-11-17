package com.medmate.clinic.routing;

import com.medmate.clinic.security.ClinicPrincipal;
import java.util.Objects;
import javax.sql.DataSource;
import org.springframework.stereotype.Component;

@Component
public final class ClinicRouting {

    private final ClinicRegistry registry;
    private final ClinicDataSourceFactory dataSourceFactory;

    public ClinicRouting(ClinicRegistry registry, ClinicDataSourceFactory dataSourceFactory) {
        this.registry = Objects.requireNonNull(registry, "registry");
        this.dataSourceFactory = Objects.requireNonNull(dataSourceFactory, "dataSourceFactory");
    }

    public DataSource route(ClinicPrincipal principal) {
        Objects.requireNonNull(principal, "principal");
        ClinicRegistryRow row = registry.find(principal.clinicId()).orElseThrow(ClinicUnavailableException::new);
        try {
            DataSource dataSource = dataSourceFactory.create(row, principal);
            if (dataSource == null) {
                throw new ClinicUnavailableException();
            }
            return dataSource;
        } catch (ClinicUnavailableException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new ClinicUnavailableException(exception);
        }
    }
}
