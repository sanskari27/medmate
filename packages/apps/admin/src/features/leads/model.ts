export type LeadStatus = "new" | "contacted";
export type LeadSite = "nammamedmate" | "medmatepharmacy";
export type LeadType = "contact" | "demo" | "early-access" | "pharmacy-partner";

export type LeadSummary = {
  id: string;
  site: LeadSite;
  type: LeadType;
  status: LeadStatus;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
};

export type Lead = LeadSummary & {
  pharmacyName: string | null;
  cityPincode: string | null;
  area: string | null;
  city: string | null;
  preferredTime: string | null;
  monthlySales: string | null;
  subject: string | null;
  message: string | null;
  source: string | null;
  notes: string | null;
  plan: string | null;
  consent: boolean | null;
};

export type LeadPage = {
  leads: LeadSummary[];
  page: number;
  size: number;
  total: number;
};

export type LeadFilters = {
  status: "" | LeadStatus;
  site: "" | LeadSite;
  type: "" | LeadType;
};

export const emptyFilters: LeadFilters = { status: "", site: "", type: "" };

export function siteLabel(site: string): string {
  if (site === "nammamedmate") return "Namma MedMate";
  if (site === "medmatepharmacy") return "MedMate Pharmacy";
  return site;
}

export function formLabel(type: string): string {
  if (type === "contact") return "Contact";
  if (type === "demo") return "Demo";
  if (type === "early-access") return "Early access";
  if (type === "pharmacy-partner") return "Pharmacy partner";
  return type;
}

export function statusLabel(status: string): string {
  if (status === "new") return "New";
  if (status === "contacted") return "Contacted";
  return status;
}

export function contactLine(lead: Pick<LeadSummary, "type" | "phone" | "email">): string {
  return `${formLabel(lead.type)} · ${lead.phone || lead.email || "—"}`;
}

export function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function fieldValue(value: string | boolean | null): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value;
}
