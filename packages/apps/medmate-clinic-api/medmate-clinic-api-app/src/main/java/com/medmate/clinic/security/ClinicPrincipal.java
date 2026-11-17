package com.medmate.clinic.security;

import java.util.UUID;

public record ClinicPrincipal(UUID accountId, UUID clinicId, String clinicRole) {}
