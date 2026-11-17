package com.medmate.clinic.routing;

import com.medmate.clinic.security.ClinicPrincipal;
import javax.sql.DataSource;

@FunctionalInterface
public interface ClinicDataSourceFactory {

    DataSource create(ClinicRegistryRow row, ClinicPrincipal principal);
}
