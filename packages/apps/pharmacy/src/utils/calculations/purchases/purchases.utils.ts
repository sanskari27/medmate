import {
  mrpOf,
  stockOf,
  type DosageForm,
  type InvProduct,
  type Schedule,
} from "@/utils/calculations/stock";

// ── suppliers / distributors ────────────────────────────────────
export type Supplier = {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  contactPerson?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  dlNo?: string; // distributor's drug licence
  paymentTerms?: string; // e.g. "30 days credit"
  outstanding?: number; // amount payable to this distributor
  active?: boolean;
};

// ════════════════════════════════════════════════════════════════
// Purchases / goods-inward (GRN) — distributor billing auto-stocks
// ════════════════════════════════════════════════════════════════
// A line on a distributor's purchase invoice. On save, each line either
// tops up an existing batch or creates a new batch / new product.
export type PurchaseItem = {
  productId: string | null; // null = a brand-new product to add to the catalogue
  name: string;
  batchNo: string;
  expiry: string; // "YYYY-MM"
  qty: number; // billed (charged) units
  freeQty: number; // scheme/free goods — stocked but not charged
  ptr: number; // purchase rate per unit (ex-GST, "price to retailer")
  mrp: number; // printed MRP for this batch
  gst: number; // GST %
  hsn: string;
  // catalogue meta — used only when productId === null (new product)
  composition?: string;
  manufacturer?: string;
  form?: DosageForm;
  pack?: string;
  category?: string;
  schedule?: Schedule;
  reorderLevel?: number;
  emoji?: string;
};

export type Purchase = {
  id: string; // internal GRN no e.g. "GRN-3104"
  supplierId: string;
  supplierName: string;
  invoiceNo: string; // distributor's invoice number
  invoiceDate: string; // "YYYY-MM-DD"
  items: PurchaseItem[];
  createdAt: number;
};

export type PurchaseTotals = {
  taxable: number;
  gst: number;
  total: number;
  units: number;
  lines: number;
};
export function purchaseTotals(items: PurchaseItem[]): PurchaseTotals {
  let taxable = 0;
  let gst = 0;
  let units = 0;
  for (const item of items) {
    const charged = item.ptr * item.qty; // free goods are stocked but not billed
    taxable += charged;
    gst += (charged * item.gst) / 100;
    units += item.qty + (item.freeQty || 0);
  }
  return { taxable, gst, total: taxable + gst, units, lines: items.length };
}

// a fresh blank purchase line (defaults inherited from a product if given)
export const blankPurchaseItem = (p?: InvProduct): PurchaseItem => ({
  productId: p?.id ?? null,
  name: p?.name ?? "",
  batchNo: "",
  expiry: "2027-06",
  qty: 0,
  freeQty: 0,
  ptr: p?.batches[0]?.ptr ?? 0,
  mrp: p ? mrpOf(p) : 0,
  gst: p?.gst ?? 12,
  hsn: p?.hsn ?? "3004",
  composition: "",
  manufacturer: "",
  form: "Tablet",
  pack: "",
  category: "fever",
  schedule: "OTC",
  reorderLevel: 20,
});

// ── purchase orders (reorder → distributor) ─────────────────────
export type POItem = { productId: string; name: string; qty: number };
export type POStatus = "draft" | "sent" | "received";
export type PurchaseOrder = {
  id: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  status: POStatus;
  note?: string;
  createdAt: number;
};
// ── distributor supply list (which products each distributor supplies) ──
// many-to-many: the SAME medicine can be sourced from several distributors,
// each quoting their own purchase price (PTR) so prices can be compared.
export type SupplyEntry = {
  id: string;
  productId: string;
  supplierId: string;
  purchasePrice: number; // ₹ per pack quoted by this distributor (cost / PTR)
  mrp?: number; // MRP quoted by this distributor (optional)
  preferred?: boolean; // owner's preferred source for this product
  bonusBuy?: number; // free-goods scheme: buy N …
  bonusFree?: number; // … get M free (e.g. 10 + 1)
  note?: string; // e.g. "free shipping above ₹5000", credit note, etc.
};
// free-goods scheme label, e.g. "10+1" (or "" if none)
export const schemeLabel = (e: SupplyEntry): string =>
  e.bonusBuy && e.bonusFree ? `${e.bonusBuy}+${e.bonusFree}` : "";
// landed cost per pack AFTER applying the free-goods bonus scheme
/** Cost of one pack after a free-goods scheme. "Buy 10 get 1" spreads the price over 11 packs. */
export const effectiveSupplyPrice = (entry: SupplyEntry): number => {
  const paidPacks = entry.bonusBuy || 0;
  const freePacks = entry.bonusFree || 0;
  if (paidPacks > 0 && freePacks > 0)
    return (entry.purchasePrice * paidPacks) / (paidPacks + freePacks);
  return entry.purchasePrice;
};
// cheapest supply row for a product by LANDED price (after free-goods bonus)
export const bestSupplyFor = (productId: string, list: SupplyEntry[]): SupplyEntry | undefined => {
  const quotes = list.filter((entry) => entry.productId === productId);
  if (!quotes.length) return undefined;
  return quotes.reduce((cheapest, quote) =>
    effectiveSupplyPrice(quote) < effectiveSupplyPrice(cheapest) ? quote : cheapest,
  );
};

/**
 * Distributor saved on the medicine.
 * If none is saved, the same medicine id always picks the same distributor from the list.
 */
export const allottedSupplierId = (product: InvProduct, suppliers: Supplier[]): string => {
  const saved = product.supplierId;
  if (saved && suppliers.some((supplier) => supplier.id === saved)) return saved;
  if (!suppliers.length) return "";
  const fromProductId = product.id.charCodeAt(1) + (product.id.charCodeAt(2) || 0);
  return suppliers[fromProductId % suppliers.length].id;
};
// suggested distributor for reordering: owner's explicit choice wins, else the
// cheapest landed-price supplier (after bonus), else the deterministic fallback.
/** Saved distributor, otherwise the cheapest quote, otherwise the stable fallback. */
export const suggestedSupplierId = (
  product: InvProduct,
  suppliers: Supplier[],
  supplyList: SupplyEntry[],
): string => {
  const saved = product.supplierId;
  if (saved && suppliers.some((supplier) => supplier.id === saved)) return saved;
  const cheapest = bestSupplyFor(product.id, supplyList);
  if (cheapest && suppliers.some((supplier) => supplier.id === cheapest.supplierId))
    return cheapest.supplierId;
  return allottedSupplierId(product, suppliers);
};
// suggested reorder qty to bring stock up to ~2× the reorder level
export const suggestedReorderQty = (p: InvProduct) => Math.max(0, p.reorderLevel * 2 - stockOf(p));
