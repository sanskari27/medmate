import { pharmacyOwnerMeta } from "@/content/pages/pharmacy-owner";

export const HOME_TITLE =
  "Namma MedMate — Pharmacy Management Software for Chemists in Bengaluru";

export const HOME_DESCRIPTION =
  "Namma MedMate is pharmacy management software for chemists in Bengaluru and across India — fast GST billing & POS, live inventory & expiry, customer CRM and hospital-ward credit, all in one console and live in about 7 days. An online store and delivery network are launching soon in Bengaluru. Book a free demo.";

export type PageMeta = {
  title: string;
  description: string;
};

const home: PageMeta = { title: HOME_TITLE, description: HOME_DESCRIPTION };

export const pageMeta: Record<string, PageMeta> = {
  "/": home,
  "/pharmacy-owner": {
    title: pharmacyOwnerMeta.title,
    description: HOME_DESCRIPTION,
  },
  "/stories": {
    title: "Customer Stories | Namma MedMate Bengaluru",
    description: HOME_DESCRIPTION,
  },
  "/about": {
    title: "About Us — Our Story & Founder | Namma MedMate Bengaluru",
    description: HOME_DESCRIPTION,
  },
  "/contact": {
    title: "Contact Us | Namma MedMate Bengaluru",
    description: HOME_DESCRIPTION,
  },
  "/privacy": home,
  "/terms": home,
  "/refund": home,
};

export const NOT_FOUND_META: PageMeta = {
  title: "Page not found | Namma MedMate",
  description: HOME_DESCRIPTION,
};

export function metaFor(urlPath: string): PageMeta {
  const path = urlPath.split("?")[0]?.split("#")[0] || "/";
  const normalized = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  return pageMeta[normalized] ?? NOT_FOUND_META;
}
