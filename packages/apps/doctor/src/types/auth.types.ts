export type Session = {
  accessToken: string;
  refreshToken: string;
};

export type SignStep = "phone" | "otp" | "pin" | "pin-setup";
