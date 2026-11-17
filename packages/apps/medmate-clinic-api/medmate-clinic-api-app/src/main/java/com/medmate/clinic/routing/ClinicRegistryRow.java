package com.medmate.clinic.routing;

import java.util.UUID;

public record ClinicRegistryRow(UUID clinicId, String databaseName, String displayName) {}
