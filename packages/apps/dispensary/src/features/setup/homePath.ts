import type { Account } from "@/types";

export function homePath(account: Account, pinReset: boolean) {
  if (account.pharmacyRole === "owner" && account.disabled) return "/account-restricted";
  if (account.pinSetupRequired || pinReset) return "/pin";
  if (account.pharmacyRole !== "owner") return "/dashboard";
  if (account.verificationStatus === "incomplete" || account.verificationStatus === "rejected") {
    return "/setup";
  }
  if (
    account.verificationStatus === "pending_compliance" ||
    account.verificationStatus === "pending_admin"
  ) {
    return "/application-status";
  }
  return "/dashboard";
}

export function selectHomePath(state: {
  auth: { session: { account: Account } | null; pinReset: boolean };
}) {
  const { session, pinReset } = state.auth;
  if (!session) return "/";
  return homePath(session.account, pinReset);
}
