package com.medmate.server.identity.access;

import java.util.Set;
import java.util.UUID;

public record AccountPrincipal(
        UUID id,
        String phone,
        AccountType accountType,
        String displayName,
        boolean disabled,
        UUID pharmacyId,
        PharmacyRole pharmacyRole,
        VerificationStatus verificationStatus,
        String rejectionStage,
        String rejectionComment,
        Set<StaffSubtype> subtypes,
        Set<String> permissions,
        boolean pinSet,
        String pharmacyType) {}
