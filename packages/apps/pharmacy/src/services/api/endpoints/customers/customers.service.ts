import type { PayMode, Referral } from "@/utils";
import { request } from "@/services/api/request";

export const customersService = {
  recordCreditPayment: (payment: {
    custKey: string;
    custName: string;
    custPhone: string;
    amount: number;
    mode: PayMode;
    note?: string;
  }) => request("/credit/payments", { method: "POST", body: payment }),
  addReferral: (referral: { name: string; area?: string }) =>
    request("/referrals", { method: "POST", body: referral }),
  updateReferral: (id: string, patch: Partial<Referral>) =>
    request(`/referrals/${id}`, { method: "PATCH", body: patch }),
};
