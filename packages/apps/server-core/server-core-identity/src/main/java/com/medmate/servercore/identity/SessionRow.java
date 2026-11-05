package com.medmate.servercore.identity;

import java.time.Instant;
import java.util.UUID;

public record SessionRow(
        String token,
        UUID pharmacyId,
        String userId,
        String phone,
        boolean pricingUnlocked,
        String impersonator,
        String pricingPin,
        String businessType,
        Instant expiresAt,
        boolean hasPin) {
}
