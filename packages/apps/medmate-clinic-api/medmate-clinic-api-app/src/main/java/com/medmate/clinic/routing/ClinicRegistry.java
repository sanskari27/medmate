package com.medmate.clinic.routing;

import java.util.Optional;
import java.util.UUID;

public interface ClinicRegistry {

    Optional<ClinicRegistryRow> find(UUID clinicId);
}
