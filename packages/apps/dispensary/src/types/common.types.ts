export type AccountType = "pharmacy" | "admin";

export type OtpPurpose = "login" | "signup" | "pin_reset";

/** Role inside a pharmacy account. Both sign in with accountType "pharmacy". */
export type PharmacyPortalRole = "owner" | "staff";

export type VerificationStatus =
  "incomplete" | "rejected" | "pending_compliance" | "pending_admin" | "approved";
