export type AccountType = "pharmacy" | "admin" | "staff";

export type OtpPurpose = "login" | "signup" | "pin_reset";

export type BusinessType = "pharmacy" | "hospital";

export type PharmacyPortalRole = "owner" | "staff";

export type VerificationStatus =
  "incomplete" | "rejected" | "pending_compliance" | "pending_admin" | "approved";
