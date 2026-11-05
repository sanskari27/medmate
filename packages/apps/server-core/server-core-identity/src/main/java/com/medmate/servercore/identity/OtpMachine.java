package com.medmate.servercore.identity;

public final class OtpMachine {
    private OtpMachine() {
    }

    public record State(String hash, long expiresAt, int attempts, long sentAt, int sendCount, long windowStart) {
    }

    public static Prepared prepare(State previous, long now, EnvNumbers.OtpSettings settings) {
        State active = previous != null && previous.hash() != null && !previous.hash().isEmpty() ? previous : null;
        if (active != null && now - active.sentAt() < settings.cooldownMillis()) {
            return Prepared.error("cooldown");
        }
        int sendCount = 1;
        long windowStart = now;
        if (active != null && now - active.windowStart() < settings.windowMillis()) {
            if (active.sendCount() >= settings.maxSends()) {
                return Prepared.error("rate");
            }
            sendCount = active.sendCount() + 1;
            windowStart = active.windowStart();
        }
        String otp = SecretHashes.otp(settings.length());
        return Prepared.ok(otp, new State(SecretHashes.hashSecret(otp), now + settings.ttlMillis(), 0, now, sendCount, windowStart));
    }

    public static Judged judge(State state, String code, long now, int maxAttempts) {
        if (state == null || state.hash() == null || state.hash().isEmpty()) {
            return new Judged("missing", null);
        }
        if (state.expiresAt() <= now) {
            return new Judged("expired", null);
        }
        if (state.attempts() >= maxAttempts) {
            return new Judged("locked", state);
        }
        if (SecretHashes.matches(code, state.hash())) {
            return new Judged("ok", null);
        }
        int attempts = state.attempts() + 1;
        State next = new State(state.hash(), state.expiresAt(), attempts, state.sentAt(), state.sendCount(), state.windowStart());
        return new Judged(attempts >= maxAttempts ? "locked" : "invalid", next);
    }

    public record Prepared(String otp, State state, String error) {
        static Prepared ok(String otp, State state) {
            return new Prepared(otp, state, null);
        }

        static Prepared error(String error) {
            return new Prepared(null, null, error);
        }
    }

    public record Judged(String result, State next) {
    }
}
