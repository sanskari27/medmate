export const pharmacyEndpoints = {
  application: "/pharmacy/application",
  profile: "/pharmacy/profile",
  invoiceSettings: "/pharmacy/invoice-settings",
} as const;

export const authEndpoints = {
  sendOtp: "/auth/otp/send",
  verifyOtp: "/auth/otp/verify",
  pin: "/auth/pin",
  setPin: "/auth/pin/set",
  refresh: "/auth/refresh",
  signOut: "/auth/sign-out",
} as const;
