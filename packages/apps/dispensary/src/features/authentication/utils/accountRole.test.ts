import { describe, expect, it } from "vitest";
import type { Account, AccountType, PharmacyPortalRole } from "@/types";
import { pharmacyRoleLabel, roleMismatch } from "./accountRole";

function account(role: PharmacyPortalRole | null, type: AccountType = "pharmacy"): Account {
  return {
    id: "account-id",
    accountType: type,
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: null,
    pharmacyRole: role,
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  };
}

describe("roleMismatch", () => {
  it("accepts the selected pharmacy role", () => {
    expect(roleMismatch(account("owner"), "owner")).toBeNull();
    expect(roleMismatch(account("staff"), "staff")).toBeNull();
  });

  it("rejects the other pharmacy role", () => {
    expect(roleMismatch(account("staff"), "owner")).toBe(
      "This number is a staff account. Choose Staff to sign in.",
    );
    expect(roleMismatch(account("owner"), "staff")).toBe(
      "This number is a pharmacy owner. Choose Pharmacy owner to sign in.",
    );
  });

  it("rejects an account that is not a pharmacy", () => {
    expect(roleMismatch(account(null, "admin"), "owner")).toBe(
      "This number is not a dispensary account.",
    );
  });
});

describe("pharmacyRoleLabel", () => {
  it("names the two portal roles", () => {
    expect(pharmacyRoleLabel("owner")).toBe("Pharmacy owner");
    expect(pharmacyRoleLabel("staff")).toBe("Pharmacy staff");
  });
});
