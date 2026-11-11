import { describe, expect, it } from "vitest";
import type { Account, AccountType } from "@/types";
import { accountRoleLabel, canReview, canUseAdminPortal } from "./portalAccount";

function account(type: AccountType, subtypes: string[] = []): Account {
  return {
    id: "account-id",
    accountType: type,
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: null,
    pharmacyRole: null,
    verificationStatus: null,
    rejection: null,
    subtypes,
    permissions: [],
    pinSetupRequired: false,
  };
}

describe("accountRoleLabel", () => {
  it("names an admin and joins staff roles in a fixed order", () => {
    expect(accountRoleLabel(account("admin"))).toBe("Platform admin");
    expect(accountRoleLabel(account("staff", ["finance"]))).toBe("Finance");
    expect(accountRoleLabel(account("staff", ["finance", "compliance"]))).toBe(
      "Compliance, Finance",
    );
    expect(accountRoleLabel(account("staff", ["support", "sales"]))).toBe("Sales, Support");
    expect(accountRoleLabel(account("staff", []))).toBe("Staff");
  });
});

describe("portal access", () => {
  it("keeps admin and every staff subtype", () => {
    expect(canUseAdminPortal(account("admin"))).toBe(true);
    expect(canUseAdminPortal(account("staff", ["compliance"]))).toBe(true);
    expect(canUseAdminPortal(account("staff", ["finance"]))).toBe(true);
    expect(canUseAdminPortal(account("staff", ["sales"]))).toBe(true);
    expect(canUseAdminPortal(account("staff", ["support"]))).toBe(true);
    expect(canUseAdminPortal(account("staff", []))).toBe(false);
    expect(canUseAdminPortal(account("pharmacy"))).toBe(false);
    expect(canReview(account("admin"))).toBe(true);
    expect(canReview(account("staff", ["compliance"]))).toBe(true);
    expect(canReview(account("staff", ["finance", "compliance"]))).toBe(true);
    expect(canReview(account("staff", ["finance"]))).toBe(false);
  });
});
