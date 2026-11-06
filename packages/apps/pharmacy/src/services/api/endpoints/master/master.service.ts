import type { BillingCycle, Plan } from "@/utils";
import { request } from "@/services/api/request";

export type MasterSeats = {
  included: number | null;
  extra: number;
  inUse: number;
  limit: number | null;
};

export type MasterKyc = {
  gstin: string;
  pan: string;
  dlNo: string;
  fssai: string;
  pharmacist?: string;
  bank?: { bankName?: string; accountNumber?: string; ifsc?: string } | null;
};

export type MasterPharmacy = {
  id: string;
  phone: string;
  name: string;
  city: string;
  plan: string;
  cycle: string;
  status: string;
  renewsOn: string;
  businessType: string;
  seats: MasterSeats;
  kyc: MasterKyc;
};

export type MasterGrant = { route: string; until?: string };

export type MasterRequest = {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  phone: string;
  plan: Plan;
  cycle: BillingCycle;
  kind: string;
  createdAt: number;
  status: string;
};

export type MasterTicket = {
  id: string;
  subject: string;
  status: string;
  pharmacyId?: string;
  pharmacyName?: string;
  category?: string;
};

export type MasterReferral = {
  id: string;
  name: string;
  status: string;
  reward: number;
  paidAt?: number;
  paidBy?: string;
  pharmacyId?: string;
  pharmacyName?: string;
};

export type MasterBooking = {
  id: number;
  name: string;
  phone: string;
  area: string;
  note: string;
  status: string;
  at: string;
};

export type MasterProfile = MasterPharmacy & {
  tickets: MasterTicket[];
  referrals: MasterReferral[];
  grants: MasterGrant[];
  requests: {
    id: string;
    plan: string;
    cycle: string;
    kind: string;
    createdAt: number;
    status: string;
  }[];
};

export type MasterAudit = {
  phone: string;
  pharmacyId: string;
  pharmacyName: string;
  action: string;
  before: unknown;
  after: unknown;
  reason: string;
  at: string;
};

export type MasterCoupon = {
  code: string;
  plan: string;
  expiresOn: string;
  validDays: number;
  redeemed: number;
};

export type CouponPreview = {
  code: string;
  plan: Plan;
  expiresOn: string;
  validDays: number;
  expired: boolean;
  renewsOn: string;
};

export const masterService = {
  session: () => request<{ phone: string }>("/master/session"),
  pharmacies: () => request<MasterPharmacy[]>("/master/pharmacies"),
  requests: () => request<MasterRequest[]>("/master/requests"),
  work: () => request<{ tickets: MasterTicket[]; referrals: MasterReferral[] }>("/master/work"),
  consultations: () => request<MasterBooking[]>("/master/consultations"),
  audit: () => request<MasterAudit[]>("/master/audit"),
  pharmacy: (id: string) => request<MasterProfile>(`/master/pharmacies/${id}`),
  save: (path: string, method: string, body: unknown) => request(path, { method, body }),
  signOut: () => request("/master/sign-out", { method: "POST" }),
  markConsultation: (id: number) =>
    request(`/master/consultations/${id}`, { method: "PATCH", body: { status: "handled" } }),
  impersonate: (id: string) =>
    request(`/master/pharmacies/${id}/impersonate`, { method: "POST", body: {} }),
  coupons: () => request<MasterCoupon[]>("/master/coupons"),
  issueCoupon: (body: { code: string; plan: Plan; expiresOn: string; validDays: number }) =>
    request("/master/coupons", { method: "POST", body }),
};

export const subscriptionService = {
  previewCoupon: (code: string) =>
    request<CouponPreview>("/subscription/coupons/preview", { method: "POST", body: { code } }),
};
