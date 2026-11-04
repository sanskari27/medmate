import detailsJson from "./details.json";
import { inr, isThin, type Details, type Product } from "./catalogue";

const DETAILS = detailsJson as unknown as Record<string, Details>;

/** Full listing copy. Imported only by medicine pages so the rest of the site does not download it. */
export const details = (id: string): Details | undefined => DETAILS[id];

const plain = (s: string) => s.replace(/\s+/g, " ").trim();

/** Short description for meta tags and cards. */
export function summary(p: Product, max = 155) {
  const d = details(p.id);
  const parts = [
    isThin(p) ? `${p.name}, ${p.sub.toLowerCase()}.` : `${p.name}${p.comp && p.comp !== p.name ? ` (${p.comp})` : ""} by ${p.brand}.`,
    p.use ? `Used for ${p.use.replace(/^Treatment of /i, "").toLowerCase()}.` : "",
    `MRP ${inr(d?.mrp ? Math.round(d.mrp) : p.mrp)}${d?.pack ? ` for ${d.pack}` : ""}.`,
    p.rx ? "Prescription required." : "",
    "Medicine information from MedMate, Bengaluru.",
  ];
  let out = "";
  for (const part of parts.filter(Boolean)) {
    if ((out + " " + part).trim().length > max) break;
    out = (out + " " + part).trim();
  }
  return plain(out);
}
