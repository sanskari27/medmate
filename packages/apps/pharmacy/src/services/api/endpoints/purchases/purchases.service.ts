import type { Expense, Purchase, PurchaseItem, Supplier, SupplyEntry } from "@/utils";
import { request } from "@/services/api/request";

export const purchasesService = {
  receivePurchase: (draft: {
    supplierId: string;
    supplierName: string;
    invoiceNo: string;
    invoiceDate: string;
    items: PurchaseItem[];
  }) =>
    request<{ purchase: Purchase }>("/purchases/receive", {
      method: "POST",
      body: draft,
      idempotency: true,
    }),
  sendPurchaseOrder: (body: {
    supplierId: string;
    supplierName: string;
    items: { productId: string; name: string; qty: number }[];
    note?: string;
  }) => request("/purchase-orders", { method: "POST", body }),
  importPurchaseOrders: (
    rows: { supplierName: string; productName: string; qty: number; note?: string }[],
  ) =>
    request<{ created: number; skipped: string[] }>("/purchase-orders/import", {
      method: "POST",
      body: { rows },
    }),
  markPurchaseOrderReceived: (id: string) =>
    request(`/purchase-orders/${id}/received`, { method: "POST" }),
  addExpense: (expense: Omit<Expense, "id" | "number">) =>
    request("/expenses", { method: "POST", body: expense }),
  updateExpense: (id: string, patch: Partial<Expense>) =>
    request(`/expenses/${id}`, { method: "PATCH", body: patch }),
  addExpenseCategory: (name: string) =>
    request("/expense-categories", { method: "POST", body: { name } }),
  addSupplier: (supplier: Omit<Supplier, "id">) =>
    request("/suppliers", { method: "POST", body: supplier }),
  updateSupplier: (id: string, patch: Partial<Supplier>) =>
    request(`/suppliers/${id}`, { method: "PATCH", body: patch }),
  addSupply: (entry: Omit<SupplyEntry, "id">) =>
    request("/supply-list", { method: "POST", body: entry }),
  updateSupply: (id: string, patch: Partial<SupplyEntry>) =>
    request(`/supply-list/${id}`, { method: "PATCH", body: patch }),
  setPreferredSupply: (id: string) => request(`/supply-list/${id}/preferred`, { method: "POST" }),
};
