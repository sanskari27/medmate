import { API_BASE_URL } from "@/lib/site";

export async function postLead(body: Record<string, string | boolean>): Promise<void> {
  const honeypot = String(body.companyWebsite ?? "");
  if (honeypot.trim()) return;

  const res = await fetch(`${API_BASE_URL}/api/v1/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("lead");
}
