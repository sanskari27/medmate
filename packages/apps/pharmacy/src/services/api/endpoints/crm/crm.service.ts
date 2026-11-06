import type { Campaign, Feedback, PatientMeta, ReminderLog } from "@/utils";
import { request } from "@/services/api/request";

export const crmService = {
  setPatientMeta: (key: string, patch: PatientMeta) =>
    request(`/crm/patients/${encodeURIComponent(key)}`, { method: "PATCH", body: patch }),
  addCampaign: (campaign: Omit<Campaign, "id" | "sentAt">) =>
    request("/crm/campaigns", { method: "POST", body: campaign }),
  addFeedback: (feedback: Omit<Feedback, "id" | "at">) =>
    request("/crm/feedback", { method: "POST", body: feedback }),
  logReminder: (reminder: Omit<ReminderLog, "id" | "at">) =>
    request("/crm/reminders", { method: "POST", body: reminder }),
  redeemPoints: (body: { custKey: string; custName: string; points: number }) =>
    request("/crm/redemptions", { method: "POST", body }),
};
