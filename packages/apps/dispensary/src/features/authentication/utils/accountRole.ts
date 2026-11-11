import type { Account, PharmacyPortalRole } from "@/types";

export function pharmacyRoleLabel(role: string | null | undefined): string {
  if (role === "owner") return "Pharmacy owner";
  if (role === "staff") return "Pharmacy staff";
  return "Pharmacy";
}

/** Compare the signed-in account with the role the person selected. */
export function roleMismatch(account: Account, expected: PharmacyPortalRole): string | null {
  if (account.accountType !== "pharmacy") {
    return "This number is not a dispensary account.";
  }
  if (account.pharmacyRole === expected) return null;
  if (account.pharmacyRole === "owner") {
    return "This number is a pharmacy owner. Choose Pharmacy owner to sign in.";
  }
  if (account.pharmacyRole === "staff") {
    return "This number is a staff account. Choose Staff to sign in.";
  }
  return "This number is not a dispensary account.";
}
