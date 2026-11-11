import type { AccountType, OtpPurpose } from "@/types";

export type { Account, Session } from "@/types";

export type OtpSendRequest = {
  phone: string;
  accountType: AccountType | "platform";
  purpose: OtpPurpose;
};

export type OtpSendResponse = {
  mode: "otp" | "pin";
};

export type OtpVerifyRequest = OtpSendRequest & {
  code: string;
};

export type PinRequest = {
  phone: string;
  accountType: AccountType | "platform";
  pin: string;
};

export type PinSetRequest = {
  pin: string;
};

export type SignOutRequest = {
  refreshToken: string;
};

export type FieldFault = {
  field: "phone" | "otp" | "pin";
  message: string;
};
