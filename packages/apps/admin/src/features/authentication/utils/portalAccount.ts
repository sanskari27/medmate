import type { Account } from "@/types";

const STAFF_ROLES = ["compliance", "finance", "sales", "support"] as const;

const ROLE_LABELS: Record<(typeof STAFF_ROLES)[number], string> = {
  compliance: "Compliance",
  finance: "Finance",
  sales: "Sales",
  support: "Support",
};

function isStaffRole(value: string): value is (typeof STAFF_ROLES)[number] {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

export function canReview(account: Account | null | undefined): boolean {
  if (!account) return false;
  return account.accountType === "admin" || account.subtypes.includes("compliance");
}

export function canHandleSupportCases(account: Account | null | undefined): boolean {
  if (!account || account.accountType !== "staff") return false;
  return account.subtypes.includes("support");
}

export function canSupport(account: Account | null | undefined): boolean {
  if (!account) return false;
  return account.accountType === "admin" || canHandleSupportCases(account);
}

export function canUseAdminPortal(account: Account): boolean {
  if (account.accountType === "admin") return true;
  return (
    account.accountType === "staff" && account.subtypes.some((subtype) => isStaffRole(subtype))
  );
}

/** Role line for the signed-in account. Several staff roles stay in a fixed order. */
export function accountRoleLabel(account: Account): string {
  if (account.accountType === "admin") return "Platform admin";
  const labels = STAFF_ROLES.filter((role) => account.subtypes.includes(role)).map(
    (role) => ROLE_LABELS[role],
  );
  if (labels.length === 0) return "Staff";
  return labels.join(", ");
}
