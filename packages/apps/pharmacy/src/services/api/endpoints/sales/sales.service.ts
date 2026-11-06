import type { Offer, PayMode, Rider, Sale } from "@/utils";
import { request } from "@/services/api/request";

export const salesService = {
  advanceOrder: (id: string) => request(`/sales/${id}/advance`, { method: "POST" }),
  cancelOrder: (id: string) =>
    request(`/sales/${id}/cancel`, { method: "POST", body: {}, idempotency: true }),
  startPacking: (id: string) => request(`/sales/${id}/packing/start`, { method: "POST" }),
  scanPackLine: (id: string, code: string) =>
    request<{ name: string; batchNo: string; scanned: number; qty: number }>(
      `/sales/${id}/packing/scan`,
      { method: "POST", body: { code }, idempotency: true },
    ),
  pickPackLine: (id: string, productId: string, delta: number) =>
    request(`/sales/${id}/packing/pick`, {
      method: "POST",
      body: { productId, delta },
      idempotency: true,
    }),
  sealPacket: (id: string) => request(`/sales/${id}/packing/seal`, { method: "POST" }),
  handToRider: (id: string, rider?: Rider) =>
    request(`/sales/${id}/handover`, { method: "POST", body: { rider } }),
  markPaid: (id: string, payMode: PayMode) =>
    request(`/sales/${id}/mark-paid`, { method: "POST", body: { payMode } }),
  addOffer: (offer: Offer) => request("/offers", { method: "POST", body: offer }),
  toggleOffer: (id: string) => request(`/offers/${id}/toggle`, { method: "POST", body: {} }),
  settleBills: (ids: string[], payMode: PayMode) =>
    request("/sales/settle", { method: "POST", body: { ids, payMode }, idempotency: true }),
  placeKioskOrder: (
    lines: { productId: string; qty: number; loose?: boolean }[],
    payMode: PayMode,
  ) =>
    request<{ sale: Sale; inventory: import("@/utils").InvProduct[] }>("/kiosk/orders", {
      method: "POST",
      body: { lines, payMode },
      idempotency: true,
    }),
};
