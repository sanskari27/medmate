import { API_BASE_URL } from "@/lib/site";

export type LeadType = "demo" | "early-access" | "contact";

export type LeadPayload = {
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
  fields: Partial<Omit<LeadPayload, "type">>,
): LeadPayload {
  return { ...emptyLead, ...fields, type };
}

/** Posts a lead to the future admin API. A filled honeypot is dropped. */
export async function submitLead(payload: LeadPayload): Promise<void> {
  if (payload.companyWebsite.trim()) return;

  const res = await fetch(`${API_BASE_URL}/api/v1/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("lead");
}
