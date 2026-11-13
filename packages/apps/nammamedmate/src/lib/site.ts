export const SITE_URL =
  import.meta.env.VITE_SITE_URL ?? "https://www.nammamedmate.com";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://api.nammamedmate.com";

export const SUPPORT_EMAIL = "support@nammamedmate.com";

/** Public site constants used by forms and legal copy. */
export const config = {
  supportEmail: SUPPORT_EMAIL,
  patientAppUrl: "https://app.nammamedmate.com/",
  pharmacyConsoleUrl: "https://dispensary.nammamedmate.com/",
} as const;
