// ── sales (both channels) ───────────────────────────────────────
export type Channel = "online" | "offline";
export type PayMode = "cash" | "upi" | "card" | "cod" | "credit" | "insurance";
export const PAY_LABEL: Record<PayMode, string> = { cash: "Cash", upi: "UPI", card: "Card", cod: "Cash on Delivery", credit: "Credit (Khata)", insurance: "Insurance / TPA" };
// modes that actually collect money at the time of sale (credit + insurance are deferred / on account)
export const SETTLED_MODES: PayMode[] = ["cash", "upi", "card", "cod"];

// ── hospital sale source (where the sale originated) ─────────────
export type SaleSource = "opd" | "counter" | "ward" | "emergency" | "online";
export const SALE_SOURCES: { key: SaleSource; label: string; short: string }[] = [
  { key: "opd", label: "OPD Prescription", short: "OPD Rx" },
  { key: "counter", label: "Pharmacy Counter", short: "Counter" },
  { key: "ward", label: "Ward / IPD", short: "Ward" },
  { key: "emergency", label: "Emergency / Casualty", short: "Emergency" },
  { key: "online", label: "Online", short: "Online" },
];
export const SALE_SOURCE_LABEL: Record<SaleSource, string> = Object.fromEntries(SALE_SOURCES.map((s) => [s.key, s.label])) as Record<SaleSource, string>;
// effective source for any sale (falls back to channel for non-hospital / legacy sales)
export const saleSourceOf = (s: { source?: SaleSource; channel: Channel }): SaleSource =>
  s.source ?? (s.channel === "online" ? "online" : "counter");

// online order lifecycle; offline sales are "completed" immediately
export type OrderStatus = "new" | "accepted" | "packed" | "out" | "delivered" | "completed" | "cancelled";
export const ONLINE_FLOW: OrderStatus[] = ["new", "accepted", "packed", "out", "delivered"];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New order", accepted: "Accepted", packed: "Packed", out: "Out for delivery",
  delivered: "Delivered", completed: "Completed", cancelled: "Cancelled",
};

export type SaleItem = {
  productId: string;
  name: string;
  batchNo: string;
  expiry: string;
  hsn: string;
  qty: number;       // packs, or loose tablet/capsule count when loose
  mrp: number;       // unit MRP (GST-inclusive) — per pack, or per tablet when loose
  price: number;     // unit selling price (GST-inclusive, after any item discount)
  gst: number;       // GST %
  loose?: boolean;   // true = sold as individual tablets/capsules
};

export type StatusEvent = { status: OrderStatus; at: number; note?: string };

// ── online-order fulfilment (pick → scan-pack → seal → handover) ──
// A picking checklist line: how many units of an item have been scanned/packed,
// and the batch they were drawn from (so stock is deducted at the batch level).
export type PackLine = { productId: string; name: string; qty: number; scanned: number; batchNo?: string };
export type Rider = { name: string; phone?: string; vehicle?: string };
export type Fulfillment = {
  lines?: PackLine[];     // picking checklist with live scan progress
  sealed?: boolean;       // all items scanned → invoice generated + sealed in a Namma MedMate packet
  sealedAt?: number;
  rider?: Rider;          // assigned delivery partner
  handedAt?: number;      // handed over to the delivery partner (dispatched)
};
export const packTotal = (s: Sale) => s.items.reduce((a, i) => a + i.qty, 0);
export const packDone = (s: Sale) => (s.fulfillment?.lines ?? []).reduce((a, l) => a + l.scanned, 0);
export const packComplete = (s: Sale) => {
  const lines = s.fulfillment?.lines;
  if (!lines || !lines.length) return false;
  return lines.every((l) => l.scanned >= l.qty);
};

export type Sale = {
  id: string;                 // invoice no e.g. "INV-2607"
  channel: Channel;
  status: OrderStatus;
  customer: { name: string; phone?: string; address?: string; email?: string; doctor?: string; rxSource?: "doctor" | "self" };
  items: SaleItem[];
  discount: number;           // flat ₹ off (pre-tax-inclusive total)
  payMode: PayMode;
  rx: boolean;                // contained Rx-only items
  rxId?: string;              // linked prescription
  createdAt: number;
  history?: StatusEvent[];    // status-change audit trail w/ timestamps
  paid?: boolean;             // false = unpaid bill sent to reception/billing counter (default paid)
  reception?: boolean;        // routed to reception/billing counter
  ward?: string;              // hospital ward / room (optional)
  source?: SaleSource;        // hospital sale origin (OPD/counter/ward/emergency/online)
  insurer?: string;           // insurer / TPA when payMode === "insurance"
  patientId?: string;         // hospital UHID / IP number — groups an in-patient's bills for settlement
  fulfillment?: Fulfillment;  // online-order pick/pack/handover state
};

export const channelLabel = (c: Channel) => (c === "online" ? "Online" : "Counter");
