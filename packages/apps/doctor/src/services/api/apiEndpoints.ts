export const authEndpoints = {
  sendOtp: "/auth/otp/send",
  verifyOtp: "/auth/otp/verify",
  pin: "/auth/pin",
  setPin: "/auth/pin/set",
  refresh: "/auth/refresh",
  signOut: "/auth/sign-out",
} as const;

export const clinicEndpoints = {
  me: "/clinic-api/clinic/me",
  patients: "/clinic-api/clinic/patients",
} as const;
