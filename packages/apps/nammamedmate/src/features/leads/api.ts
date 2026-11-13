import { API_BASE_URL } from "@/lib/site";

export type LeadType = "demo" | "early-access" | "contact";

export type LeadPayload = {
  site: "nammamedmate";
  type: LeadType;
  name: string;
  phone: string;
  email: string;
  pharmacyName: string;
  cityPincode: string;
  preferredTime: string;
  monthlySales: string;
  subject: string;
  message: string;
  source: string;
  notes: string;
  companyWebsite: string;
};

const emptyLead = {
  name: "",
  phone: "",
  email: "",
  pharmacyName: "",
  cityPincode: "",
  preferredTime: "",
  monthlySales: "",
  subject: "",
  message: "",
  source: "",
  notes: "",
  companyWebsite: "",
};

export function leadPayload(
  type: LeadType,
  fields: Partial<Omit<LeadPayload, "type" | "site">>,
): LeadPayload {
  return { ...emptyLead, ...fields, type, site: "nammamedmate" };
}

/** Posts a lead to medmate-server. A filled honeypot is dropped. */
export async function submitLead(payload: LeadPayload): Promise<void> {
  if (payload.companyWebsite.trim()) return;

  const res = await fetch(`${API_BASE_URL}/api/v1/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("lead");
}
