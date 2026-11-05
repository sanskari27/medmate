package com.medmate.servercore.identity;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class RefreshJudge {
    private RefreshJudge() {
    }

    public record Row(String hash, String previous, long expiresAt) {
    }

    public static String judge(Row row, String presentedHash, long now) {
        if (row == null || row.hash() == null || row.hash().isEmpty()) {
            return "invalid";
        }
        if (row.previous() != null && same(row.previous(), presentedHash)) {
            return "reuse";
        }
        if (!same(row.hash(), presentedHash)) {
            return "invalid";
        }
        if (row.expiresAt() <= now) {
            return "expired";
        }
        return "ok";
    }

    private static boolean same(String left, String right) {
        byte[] a = left.getBytes(StandardCharsets.UTF_8);
        byte[] b = right.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(a, b);
    }
}
