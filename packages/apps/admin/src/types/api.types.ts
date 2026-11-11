import type { AccountType, PharmacyPortalRole, VerificationStatus } from "./common.types";

export type ProblemDetail = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  requestId?: string;
};

export type Account = {
  id: string;
  accountType: AccountType;
  phone: string;
  displayName: string | null;
  pharmacyId: string | null;
  pharmacyRole: PharmacyPortalRole | null;
  verificationStatus: VerificationStatus | null;
  rejection: { stage: string; comment: string } | null;
  subtypes: string[];
  permissions: string[];
  pinSetupRequired: boolean;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  account: Account;
};
