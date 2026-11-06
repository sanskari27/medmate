import type { InvProduct, PayMode, Prescription, Sale, SaleSource } from "@/utils";
import { request } from "@/services/api/request";

export type CheckoutBody = {
  lines: { productId: string; qty: number; loose?: boolean; batchNo?: string }[];
  customer: {
    name: string;
    phone: string;
    email: string;
    rxSource: "doctor" | "self";
    doctor: string;
  };
  discount: number;
  discountMode: "flat" | "percent";
  payMode: PayMode;
  source: SaleSource;
  ward: string;
  insurer: string;
  patientId: string;
  rxImage: string | null;
  paid?: boolean;
};

export const billingService = {
  checkout: (body: CheckoutBody) =>
    request<{ sale: Sale; prescription: Prescription | null; inventory: InvProduct[] }>(
      "/pos/checkout",
      { method: "POST", body, idempotency: true },
    ),
};
