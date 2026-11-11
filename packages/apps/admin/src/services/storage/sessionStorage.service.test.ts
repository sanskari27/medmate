import { afterEach, describe, expect, it } from "vitest";
import { SESSION_STORAGE_KEY } from "@/constants";
import type { Session } from "@/types";
import {
  clearSession,
  readPersistedAuth,
  writePersistedAuth,
  writeSession,
} from "./sessionStorage.service";

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
    pharmacyRole: "owner",
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  },
};

afterEach(() => {
  sessionStorage.clear();
});

describe("readPersistedAuth", () => {
  it("returns null for missing, corrupt, and incomplete payloads", () => {
    expect(readPersistedAuth()).toBeNull();

    sessionStorage.setItem(SESSION_STORAGE_KEY, "{");
    expect(readPersistedAuth()).toBeNull();

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(null));
    expect(readPersistedAuth()).toBeNull();

    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ accessToken: "only" }));
    expect(readPersistedAuth()).toBeNull();

    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ session: { accessToken: "only" }, pinReset: true }),
    );
    expect(readPersistedAuth()).toBeNull();
  });

  it("reads a legacy session blob with pinReset false", () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    expect(readPersistedAuth()).toEqual({ session, pinReset: false });
  });

  it("round-trips pinReset in the wrapped blob", () => {
    writePersistedAuth({ session, pinReset: true });
    expect(readPersistedAuth()).toEqual({ session, pinReset: true });

    writeSession(session);
    expect(readPersistedAuth()).toEqual({ session, pinReset: false });
  });

  it("clears the stored blob", () => {
    writePersistedAuth({ session, pinReset: true });
    clearSession();
    expect(readPersistedAuth()).toBeNull();
  });
});
