import type { InvProduct } from "@/utils";
import { request } from "@/services/api/request";

export const inventoryService = {
  addProduct: (product: InvProduct) =>
    request("/inventory/products", { method: "POST", body: product }),
  importMedicines: (products: InvProduct[]) =>
    request<{ added: number; skipped: string[] }>("/inventory/import", {
      method: "POST",
      body: { products },
    }),
  updateProduct: (id: string, patch: Partial<InvProduct>) =>
    request(`/inventory/products/${id}`, { method: "PATCH", body: patch }),
  setProductLocation: (id: string, rack: string, rackAlt?: string) =>
    request(`/inventory/products/${id}/location`, { method: "PATCH", body: { rack, rackAlt } }),
  bulkAssignLocation: (ids: string[], rack: string) =>
    request("/inventory/location/bulk", { method: "POST", body: { ids, rack } }),
  createRack: (rack: string) => request("/racks", { method: "POST", body: { rack } }),
  addBatch: (id: string, batch: InvProduct["batches"][number]) =>
    request(`/inventory/products/${id}/batches`, { method: "POST", body: batch }),
  setBatchQty: (id: string, batchNo: string, qty: number) =>
    request(`/inventory/products/${id}/batches/${encodeURIComponent(batchNo)}`, {
      method: "PATCH",
      body: { qty },
      idempotency: true,
    }),
  toggleOnline: (id: string) =>
    request(`/inventory/products/${id}/online`, { method: "POST", body: {} }),
  toggleLoose: (id: string) =>
    request(`/inventory/products/${id}/loose`, { method: "POST", body: {} }),
  setOnlinePrice: (id: string, price: number | undefined) =>
    request(`/inventory/products/${id}/online-price`, { method: "PATCH", body: { price } }),
  setProductOffer: (id: string, offerId: string | undefined) =>
    request(`/inventory/products/${id}/offer`, { method: "PATCH", body: { offerId } }),
  setDirectOffer: (productId: string, type: string, value: number) =>
    request(`/inventory/products/${productId}/direct-offer`, {
      method: "PUT",
      body: { type, value },
    }),
  setProductSupplier: (id: string, supplierId: string) =>
    request(`/inventory/products/${id}/supplier`, { method: "PATCH", body: { supplierId } }),
  setLooseDefault: (allowed: boolean) =>
    request<{ inventory?: InvProduct[] }>("/inventory/loose-default", {
      method: "POST",
      body: { allowed },
    }),
};
