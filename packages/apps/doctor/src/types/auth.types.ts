export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
};

export type SignStep = "phone" | "otp" | "pin" | "pin-setup";

export type ProblemDetail = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  requestId?: string;
};