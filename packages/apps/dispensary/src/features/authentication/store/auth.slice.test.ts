import { describe, expect, it } from "vitest";
import { AUTH_SESSION_CLEARED, AUTH_SESSION_STARTED } from "@/constants";
import type { Session } from "@/types";
import {
  applicationSubmitted,
  authReducer,
  pinSaved,
  sessionCleared,
  sessionStarted,
} from "./auth.slice";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "pharmacy",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: null,
    pharmacyRole: "owner",
    verificationStatus: "incomplete",
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

  it("stores the account returned when a PIN is saved", () => {
    const started = authReducer(undefined, sessionStarted({ session, pinReset: true }));
    const account = { ...session.account, pinSetupRequired: false, displayName: "Ada Owner" };
    const saved = authReducer(started, pinSaved(account));
    expect(saved.pinReset).toBe(false);
    expect(saved.session?.account).toEqual(account);
  });

  it("records a submitted application on the signed-in account", () => {
    const started = authReducer(undefined, sessionStarted({ session, pinReset: false }));
    const submitted = authReducer(
      started,
      applicationSubmitted({
        status: "pending_compliance",
        rejection: { stage: "compliance", comment: "Missing seal" },
        pinSetupRequired: false,
        displayName: "Care Pharmacy",
      }),
    );
    expect(submitted.session?.account.verificationStatus).toBe("pending_compliance");
    expect(submitted.session?.account.rejection).toEqual({
      stage: "compliance",
      comment: "Missing seal",
    });
    expect(submitted.session?.account.pinSetupRequired).toBe(false);
    expect(submitted.session?.account.displayName).toBe("Care Pharmacy");
  });

  it("clears the session and the PIN reset flag", () => {
    const started = authReducer(undefined, sessionStarted({ session, pinReset: true }));
    expect(authReducer(started, sessionCleared())).toEqual({ session: null, pinReset: false });
  });
});
