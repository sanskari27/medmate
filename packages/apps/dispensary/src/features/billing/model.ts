import type { InventoryBatch, InventoryProduct } from "@/features/inventory";
import type { Offer } from "@/features/offers";

export type DiscountKind = "none" | "percent" | "flat";

export type Discount = {
  type: DiscountKind;
  value: number;
};

export type CartLine = {
  key: string;
  productId: string;
  batchNo: string | null;
  qty: number;
  discountType: DiscountKind;
  discountValue: number;
};

export type AddResult = {
  lines: CartLine[];
  error: string | null;
};

export type PricedLine = {
  mrp: number;
  unitOff: number;
  unitPrice: number;
  offerDiscount: number;
  extraDiscount: number;
  discount: number;
  net: number;
  offer: Offer | null;
};

export type GstSplit = {
  gst: number;
  cgst: number;
  sgst: number;
};

export const NO_DISCOUNT: Discount = { type: "none", value: 0 };

export function canOpenBilling(role: string | null | undefined, permissions: string[] | undefined) {
  return role === "owner" || (permissions ?? []).includes("billing:read");
}

export function canCharge(role: string | null | undefined, permissions: string[] | undefined) {
  return role === "owner" || (permissions ?? []).includes("billing:create");
}

export function kolkataMonth(today = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(today);
  return parts.slice(0, 7);
}

export function sellableBatches(product: InventoryProduct, today = new Date()): InventoryBatch[] {
  const month = kolkataMonth(today);
  return product.batches
    .filter((batch) => batch.qty > 0 && batch.gst != null && batch.expiry >= month)
    .sort(
      (left, right) =>
        left.expiry.localeCompare(right.expiry) || left.batchNo.localeCompare(right.batchNo),
    );
}

export function hintBatch(product: InventoryProduct, today = new Date()): InventoryBatch | null {
  return sellableBatches(product, today)[0] ?? null;
}

export function sellableUnits(product: InventoryProduct, today = new Date()): number {
  return sellableBatches(product, today).reduce((sum, batch) => sum + batch.qty, 0);
}

export function searchResults(products: InventoryProduct[], query: string): InventoryProduct[] {
  const text = query.trim().toLowerCase();
  if (!text) return [];
  const exact = products.filter((product) => product.productId.toLowerCase() === text);
  const rest = products.filter((product) => {
    if (exact.includes(product)) return false;
    const haystack =
      `${product.name} ${product.composition ?? ""} ${product.productId}`.toLowerCase();
    return haystack.includes(text);
  });
  return [...exact, ...rest].slice(0, 8);
}

export function addProduct(
  lines: CartLine[],
  product: InventoryProduct,
  today = new Date(),
): AddResult {
  if (product.prescriptionRequired == null) {
    return { lines, error: "Prescription status is unknown" };
  }
  const batches = sellableBatches(product, today);
  if (batches.length === 0) {
    const unsold = product.batches.some(
      (batch) => batch.qty > 0 && batch.expiry >= kolkataMonth(today),
    );
    return { lines, error: unsold ? "GST rate is unknown" : "Out of stock" };
  }
  const same = lines.filter((line) => line.productId === product.productId);
  if (same.length === 0) {
    return {
      lines: [
        ...lines,
        {
          key: nextKey(lines),
          productId: product.productId,
          batchNo: batches[0]?.batchNo ?? null,
          qty: 1,
          ...NO_DISCOUNT_LINE,
        },
      ],
      error: null,
    };
  }
  const last = same[same.length - 1];
  if (!last?.batchNo) return { lines, error: null };
  const batch = batches.find((item) => item.batchNo === last.batchNo);
  if (!batch) {
    return {
      lines: [
        ...lines,
        {
          key: nextKey(lines),
          productId: product.productId,
          batchNo: batches[0]?.batchNo ?? null,
          qty: 1,
          ...NO_DISCOUNT_LINE,
        },
      ],
      error: null,
    };
  }
  if (last.qty >= batch.qty) return { lines, error: `Only ${batch.qty} left` };
  return {
    lines: lines.map((line) => (line.key === last.key ? { ...line, qty: line.qty + 1 } : line)),
    error: null,
  };
}

export function chooseBatch(
  lines: CartLine[],
  key: string,
  batchNo: string,
  product: InventoryProduct,
  today = new Date(),
): CartLine[] {
  const batch = sellableBatches(product, today).find((item) => item.batchNo === batchNo);
  if (!batch) return lines;
  const current = lines.find((line) => line.key === key);
  if (!current) return lines;
  const other = lines.find(
    (line) => line.key !== key && line.productId === current.productId && line.batchNo === batchNo,
  );
  if (!other) {
    return lines.map((line) =>
      line.key === key ? { ...line, batchNo, qty: Math.min(line.qty, batch.qty) } : line,
    );
  }
  const qty = Math.min(other.qty + current.qty, batch.qty);
  return lines
    .filter((line) => line.key !== key)
    .map((line) => (line.key === other.key ? { ...line, qty } : line));
}

export function setLineDiscount(
  lines: CartLine[],
  key: string,
  type: DiscountKind,
  value: number,
): CartLine[] {
  const discount = cleanDiscount(type, value);
  return lines.map((line) =>
    line.key === key
      ? { ...line, discountType: discount.type, discountValue: discount.value }
      : line,
  );
}

export function cleanDiscount(type: DiscountKind, value: number): Discount {
  if (type === "none" || !Number.isFinite(value) || value <= 0) {
    return { type, value: 0 };
  }
  const capped = type === "percent" ? Math.min(value, 100) : value;
  return { type, value: round2(capped) };
}

export function setQuantity(lines: CartLine[], key: string, qty: number, max: number): CartLine[] {
  const next = Math.min(Math.max(1, Math.floor(qty)), Math.max(1, max));
  return lines.map((line) => (line.key === key ? { ...line, qty: next } : line));
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function winningOffer(offers: Offer[], productId: string, mrp: number): Offer | null {
  let best: Offer | null = null;
  let saving = 0;
  for (const offer of offers) {
    if (!offer.active || !matches(offer, productId)) continue;
    const unit = unitSaving(offer, mrp);
    if (unit <= 0) continue;
    if (unit > saving || (unit === saving && preferred(offer, best))) {
      best = offer;
      saving = unit;
    }
  }
  return best;
}

export function priceLine(
  offers: Offer[],
  productId: string,
  mrp: number,
  qty: number,
  extra: Discount = NO_DISCOUNT,
): PricedLine {
  const offer = winningOffer(offers, productId, mrp);
  const unitOff = offer ? unitSaving(offer, mrp) : 0;
  const afterOffer = round2(mrp - unitOff);
  const extraUnit = discountAmount(extra, afterOffer);
  const unitPrice = round2(afterOffer - extraUnit);
  return {
    mrp,
    unitOff,
    unitPrice,
    offerDiscount: round2(unitOff * qty),
    extraDiscount: round2(extraUnit * qty),
    discount: round2((unitOff + extraUnit) * qty),
    net: round2(unitPrice * qty),
    offer,
  };
}

export function includedGst(amount: number, rate: number): GstSplit {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(rate) || rate <= 0) {
    return { gst: 0, cgst: 0, sgst: 0 };
  }
  const gst = round2(amount - amount / (1 + rate / 100));
  const cgst = round2(gst / 2);
  const sgst = round2(gst - cgst);
  return { gst, cgst, sgst };
}

export function discountAmount(discount: Discount, base: number): number {
  if (discount.type === "percent") return round2((base * Math.min(discount.value, 100)) / 100);
  if (discount.type === "flat") return round2(Math.min(Math.max(discount.value, 0), base));
  return 0;
}

export function phoneReady(phone: string): boolean {
  return /^[0-9]{10}$/.test(phone);
}

export function chargeReady(input: {
  lines: CartLine[];
  products: InventoryProduct[];
  patientName: string;
  patientPhone: string;
  prescribedBy: string;
  prescriptionNumber: string;
  today?: Date;
}): boolean {
  if (input.lines.length === 0 || !input.patientName.trim() || !phoneReady(input.patientPhone))
    return false;
  let prescription = false;
  for (const line of input.lines) {
    const product = input.products.find((item) => item.productId === line.productId);
    if (!product || !line.batchNo) return false;
    const batch = sellableBatches(product, input.today).find(
      (item) => item.batchNo === line.batchNo,
    );
    if (!batch || line.qty < 1 || line.qty > batch.qty) return false;
    if (product.prescriptionRequired) prescription = true;
  }
  if (!prescription) return true;
  return input.prescribedBy.trim().length > 0 && input.prescriptionNumber.trim().length > 0;
}

function matches(offer: Offer, productId: string): boolean {
  if (offer.scope === "product") return offer.target === productId;
  return offer.scope === "all";
}

function preferred(offer: Offer, current: Offer | null): boolean {
  if (!current) return true;
  const product = offer.scope === "product";
  const currentProduct = current.scope === "product";
  if (product !== currentProduct) return product;
  return offerNumber(offer.id) > offerNumber(current.id);
}

function offerNumber(id: string): number {
  const part = id.split("-").pop() ?? "";
  const value = Number(part);
  return Number.isFinite(value) ? value : 0;
}

function unitSaving(offer: Offer, mrp: number): number {
  if (offer.type === "pct") return round2((mrp * offer.value) / 100);
  return round2(Math.min(offer.value, mrp));
}

const NO_DISCOUNT_LINE = { discountType: "none" as const, discountValue: 0 };

function nextKey(lines: CartLine[]): string {
  const used = lines.reduce((max, line) => {
    const value = Number(line.key.slice(5));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `line-${used + 1}`;
}
