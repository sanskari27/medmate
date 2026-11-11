import { describe, expect, it } from "vitest";
import type { Account, VerificationStatus } from "@/types";
import { homePath, selectHomePath } from "./homePath";

function account(patch: Partial<Account> = {}): Account {
  return {
    id: "account-id",
    accountType: "pharmacy",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: null,
    pharmacyRole: "owner",
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
    ...patch,
  };
}

describe("homePath", () => {
  it("sends PIN setup and PIN reset to /pin before any other gate", () => {
    expect(homePath(account({ pinSetupRequired: true, pharmacyRole: "staff" }), false)).toBe(
      "/pin",
    );
    expect(homePath(account({ verificationStatus: "incomplete" }), true)).toBe("/pin");
  });

  it("sends staff and accounts without a pharmacy role to the dashboard", () => {
    expect(homePath(account({ pharmacyRole: "staff" }), false)).toBe("/dashboard");
    expect(homePath(account({ pharmacyRole: null }), false)).toBe("/dashboard");
  });

  it("routes each owner verification status", () => {
    const routes: Record<VerificationStatus | "none", string> = {
      incomplete: "/setup",
      rejected: "/setup",
      pending_compliance: "/application-status",
      pending_admin: "/application-status",
      approved: "/dashboard",
      none: "/dashboard",
    };
    expect(homePath(account({ verificationStatus: "incomplete" }), false)).toBe(routes.incomplete);
    expect(homePath(account({ verificationStatus: "rejected" }), false)).toBe(routes.rejected);
    expect(homePath(account({ verificationStatus: "pending_compliance" }), false)).toBe(
      routes.pending_compliance,
    );
    expect(homePath(account({ verificationStatus: "pending_admin" }), false)).toBe(
      routes.pending_admin,
    );
    expect(homePath(account({ verificationStatus: "approved" }), false)).toBe(routes.approved);
    expect(homePath(account({ verificationStatus: null }), false)).toBe(routes.none);
  });

  it("sends a disabled owner to the restricted screen before PIN and status", () => {
    const statuses: Array<VerificationStatus | null> = [
      "incomplete",
      "rejected",
      "pending_compliance",
      "pending_admin",
      "approved",
      null,
    ];
    for (const verificationStatus of statuses) {
      expect(homePath(account({ verificationStatus, disabled: true }), false)).toBe(
        "/account-restricted",
      );
    }
    expect(homePath(account({ disabled: true, pinSetupRequired: true }), true)).toBe(
      "/account-restricted",
    );
  });
});

describe("selectHomePath", () => {
  it("sends a signed-out visitor to login", () => {
    expect(selectHomePath({ auth: { session: null, pinReset: true } })).toBe("/");
  });

  it("uses the account and the PIN reset flag", () => {
    expect(
      selectHomePath({
        auth: {
          session: {
            account: account({ verificationStatus: "pending_admin" }),
          },
          pinReset: false,
        },
      }),
    ).toBe("/application-status");
    expect(
      selectHomePath({
        auth: {
          session: { account: account() },
          pinReset: true,
        },
      }),
    ).toBe("/pin");
  });
});
