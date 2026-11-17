/** The account the identity service returns with a session. */
export type ClinicAccount = {
  id: string;
  accountType: string;
  phone?: string;
  displayName?: string;
  clinicId?: string | null;
  clinicRole?: string | null;
  pinSetupRequired?: boolean;
  disabled?: boolean;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  account?: ClinicAccount;
};

export type SignStep = "phone" | "otp" | "pin" | "pin-setup";

export type ProblemDetail = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  requestId?: string;
};
