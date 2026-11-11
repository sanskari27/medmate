import { describe, expect, it } from "vitest";
import { AUTH_SESSION_CLEARED, AUTH_SESSION_STARTED } from "@/constants";
import type { Session } from "@/types";
import { authReducer, pinSaved, sessionCleared, sessionStarted } from "./auth.slice";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "admin",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: null,
    pharmacyRole: null,
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: true,
  },
};

describe("auth actions", () => {
  it("matches the shared session action types", () => {
    expect(sessionStarted.type).toBe(AUTH_SESSION_STARTED);
    expect(sessionCleared.type).toBe(AUTH_SESSION_CLEARED);
  });
});

describe("authReducer", () => {
  it("starts a session and keeps a PIN reset", () => {
    expect(authReducer(undefined, sessionStarted({ session, pinReset: true }))).toEqual({
      session,
      pinReset: true,
    });
  });

  it("clears the local PIN requirement without replacing the account", () => {
    const started = authReducer(undefined, sessionStarted({ session, pinReset: true }));
    const saved = authReducer(started, pinSaved());
    expect(saved.pinReset).toBe(false);
    expect(saved.session?.account.pinSetupRequired).toBe(false);
    expect(saved.session?.account.displayName).toBe("Ada");
  });

  it("clears the session and the PIN reset flag", () => {
    const started = authReducer(undefined, sessionStarted({ session, pinReset: true }));
    expect(authReducer(started, sessionCleared())).toEqual({
      session: null,
      pinReset: false,
    });
  });

  it("replaces the session when a refresh returns a new token", () => {
    const started = authReducer(undefined, sessionStarted({ session, pinReset: false }));
    const refreshed = authReducer(
      started,
      sessionStarted({ session: { ...session, accessToken: "next" }, pinReset: false }),
    );
    expect(refreshed.session?.accessToken).toBe("next");
    expect(refreshed.pinReset).toBe(false);
  });
});
