export type PurchaseAccess = {
  create: boolean;
  returnBill: boolean;
};

export type PurchaseLine = {
  position: number;
  productId: string;
  name: string;
  batchNo: string;
  expiry: string;
  qty: number;
  freeQty: number;
  rate: string;
  mrp: string;
  gst: number;
  amount: string;
  returnedQty: number;
  returnedFree: number;
  onHand: number;
};

export type PurchaseDocument = {
  id: string;
  type: "purchase" | "return";
  purchaseId: string | null;
  distributorId: string;
  distributorName: string;
  invoiceNo: string;
  invoiceDate: string;
  recordedAt: string;
  taxable: string;
  gst: string;
  total: string;
  ledgerAmount: number;
  units: number;
  lines: PurchaseLine[];
};

export type PurchaseStats = {
  purchasesThisMonth: number;
  purchaseCount: number;
  outstanding: number;
  returnsThisMonth: number;
  returnCount: number;
};

export type PurchaseList = {
  purchases: PurchaseDocument[];
  stats: PurchaseStats;
};

export type PurchaseOne = { purchase: PurchaseDocument };

export type MedicineHit = {
  productId: string;
  name: string;
  marketer: string | null;
  pack: string | null;
  mrp: number | null;
};

export type MedicineSnapshot = MedicineHit & {
  composition: string | null;
  form: string | null;
  type: string | null;
};

export type DraftLine = {
  key: string;
  productId: string;
  name: string;
  batchNo: string;
  expiry: string;
  qty: string;
  freeQty: string;
  rate: string;
  mrp: string;
  gst: string;
};

export type PurchaseDraft = {
  distributorId: string;
  invoiceNo: string;
  invoiceDate: string;
  lines: DraftLine[];
};

const GST = new Set(["0", "5", "12", "18"]);

export function canOpenPurchases(
  role: string | null | undefined,
  permissions: string[] | undefined,
) {
  return role === "owner" || (permissions ?? []).includes("purchases:read");
}

export function purchaseAccess(
  role: string | null | undefined,
  permissions: string[] | undefined,
): PurchaseAccess {
  const owner = role === "owner";
  const keys = permissions ?? [];
  return {
    create: owner || keys.includes("purchases:create"),
    returnBill: owner || keys.includes("purchases:return"),
  };
}

export function inr(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

export function inr2(amount: string | number): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  return (
    "₹" + value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function moneyTone(amount: number): string {
  if (amount > 0) return "text-[#b4232a]";
  if (amount < 0) return "text-green";
  return "text-dark";
}

export function typeLabel(type: PurchaseDocument["type"]): string {
  return type === "return" ? "Return" : "Purchase";
}

export function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function blankLine(): DraftLine {
  return {
    key: crypto.randomUUID(),
    productId: "",
    name: "",
    batchNo: "",
    expiry: "",
    qty: "",
    freeQty: "0",
    rate: "",
    mrp: "",
    gst: "",
  };
}

export function lineComplete(line: DraftLine): boolean {
  const qty = Number(line.qty);
  const free = Number(line.freeQty || "0");
  return (
    line.productId.trim().length > 0 &&
    line.batchNo.trim().length > 0 &&
    /^\d{4}-(0[1-9]|1[0-2])$/.test(line.expiry) &&
    Number.isInteger(qty) &&
    qty >= 0 &&
    Number.isInteger(free) &&
    free >= 0 &&
    qty + free > 0 &&
    moneyOk(line.rate) &&
    moneyOk(line.mrp) &&
    GST.has(line.gst)
  );
}

export function draftReady(draft: PurchaseDraft): boolean {
  return (
    draft.distributorId.trim().length > 0 &&
    draft.invoiceNo.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(draft.invoiceDate) &&
    draft.lines.some(lineComplete)
  );
}

export function purchasePayload(draft: PurchaseDraft) {
  return {
    distributorId: draft.distributorId,
    invoiceNo: draft.invoiceNo.trim(),
    invoiceDate: draft.invoiceDate,
    lines: draft.lines.filter(lineComplete).map((line) => ({
      productId: line.productId,
      batchNo: line.batchNo.trim(),
      expiry: line.expiry,
      qty: Number(line.qty),
      freeQty: Number(line.freeQty || "0"),
      rate: Number(line.rate),
      mrp: Number(line.mrp),
      gst: Number(line.gst),
    })),
  };
}

export function canReturn(document: PurchaseDocument): boolean {
  return document.lines.some((line) => {
    const billed = line.qty - line.returnedQty;
    const free = line.freeQty - line.returnedFree;
    return billed + free > 0 && line.onHand > 0;
  });
}

function moneyOk(value: string): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return false;
  return Number(value) >= 0;
}
