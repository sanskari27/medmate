export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://medmatepharmacy.com").replace(/\/$/, "");
export const APP_URL = (import.meta.env.VITE_APP_URL || "https://medmatepharmacy.com").replace(/\/$/, "");
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");
export const PHARMACY_URL = (import.meta.env.VITE_PHARMACY_URL || (import.meta.env.PROD ? "https://pharmacy.nammamedmate.com" : "http://localhost:3000")).replace(/\/$/, "");
export const PLAY_URL = import.meta.env.VITE_PLAY_URL || "";
export const IOS_URL = import.meta.env.VITE_IOS_URL || "";

/**
 * false until customers can actually order. While false, the site says "launching soon", every app button opens the
 * waitlist, and /download never forwards phones to the demo app (compliance review C2, C3).
 */
export const LAUNCHED = false;
export const LAUNCH_LINE = "Launching soon in Bengaluru";

export const COMPANY = "Medmate India Technology Private Limited";
export const REGISTERED_OFFICE = "2nd Floor, Plot No 190/108/2, Haralur Main Road, opposite Narayana Olympiad School, HSR Extension, Lakedew Residency, Bengaluru, Karnataka 560102";
export const CIN = "";
export const SUPPORT = { email: "", phone: "" };
export const GRIEVANCE_OFFICER = { name: "", designation: "", email: "", phone: "" };
export const CITY = "Bengaluru";
export const TAGLINE = "Care · delivered in minutes";

export const DEFAULT_TITLE = "MedMate: Medicine delivery in Bengaluru, launching soon";
export const DEFAULT_DESCRIPTION =
  "MedMate is launching soon in Bengaluru (Bangalore): medicines from licensed neighbourhood pharmacies, with prices compared across nearby chemists, prescription upload, doctor consultations and live rider tracking. Join the waitlist.";

export const DEFAULT_KEYWORDS = [
  "medicine delivery Bengaluru",
  "online pharmacy Bengaluru",
  "order medicines online",
  "pharmacy near me",
  "medicine delivery app",
  "upload prescription",
  "online doctor consultation",
  "sell medicines online",
  "MedMate",
];

export function downloadHref(from: string, to = "/home") {
  const q = new URLSearchParams({ from });
  if (to && to !== "/home") q.set("to", to);
  return `/download?${q}`;
}
export const downloadUrl = (from: string, to?: string) => SITE_URL + downloadHref(from, to);

export const shareText = (url: string) => `Order medicines from pharmacies near you with MedMate: ${url}`;
export const whatsappHref = (url: string) => `https://wa.me/?text=${encodeURIComponent(shareText(url))}`;
export const mailHref = (url: string) =>
  `mailto:?subject=${encodeURIComponent("MedMate app link")}&body=${encodeURIComponent(shareText(url))}`;

export const LEGAL_LINKS = [
  ["Privacy notice", "/privacy"],
  ["Terms of use", "/terms"],
  ["Contact and grievances", "/contact"],
] as const;

export const ld = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

export const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "MedMate: medicines from pharmacies near you, launching soon in Bengaluru" };

export type PageMeta = {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  absolute?: boolean;
  noindex?: boolean;
  keywords?: string[];
  rss?: boolean;
  canonical?: boolean;
  article?: { publishedTime: string; modifiedTime: string; section: string; tags: string[] };
};

export function pageMeta({ title, description, path, type = "website" }: { title: string; description: string; path: string; type?: "website" | "article" }): PageMeta {
  return { title, description, path, type };
}

export const absoluteUrl = (path: string) => (path === "/" ? SITE_URL : SITE_URL + path);
