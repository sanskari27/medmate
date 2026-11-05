import { computeInvoice } from "@/domain/invoice";
import type { InvProduct } from "@/domain/stock";
import type { Sale } from "@/domain/selling";
import { GST_RATE } from "@/domain/subscription";

// ════════════════════════════════════════════════════════════════
// Reports & analytics — periods, bucketing, GST, platform payout
// ════════════════════════════════════════════════════════════════

// ── period ranges (day / week / month / year / FY / custom) ─────
export type PeriodKind = "today" | "week" | "month" | "year" | "fy" | "custom";
export const PERIOD_LABEL: Record<PeriodKind, string> = {
  today: "Today",
  week: "This week",
  month: "This month",
  year: "This year",
  fy: "Financial year",
  custom: "Custom",
};
export type DateRange = { from: number; to: number; label: string; kind: PeriodKind };

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const endOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

// the Indian financial year (Apr 1 → Mar 31) that contains ts
export const fyOf = (ts: number) => {
  const d = new Date(ts);
  const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1; // Apr = month 3
  return {
    from: new Date(y, 3, 1).getTime(),
    to: new Date(y + 1, 2, 31, 23, 59, 59, 999).getTime(),
    label: `FY ${y}-${String(y + 1).slice(2)}`,
  };
};

export function periodRange(kind: PeriodKind, now: number, from?: number, to?: number): DateRange {
  const d = new Date(now);
  switch (kind) {
    case "week": {
      // JavaScript Sunday is 0. Shift so Monday is the first day of the week.
      const daysSinceMonday = (d.getDay() + 6) % 7;
      const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - daysSinceMonday);
      return { from: startOfDay(monday), to: endOfDay(d), label: "This week", kind };
    }
    case "month":
      return {
        from: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
        to: endOfDay(d),
        label: d.toLocaleString("en-IN", { month: "long", year: "numeric" }),
        kind,
      };
    case "year":
      return {
        from: new Date(d.getFullYear(), 0, 1).getTime(),
        to: endOfDay(d),
        label: String(d.getFullYear()),
        kind,
      };
    case "fy": {
      const f = fyOf(now);
      return { ...f, kind };
    }
    case "custom": {
      const a = from ?? startOfDay(d),
        b = to ?? endOfDay(d);
      const lab = `${new Date(a).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })} – ${new Date(b).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}`;
      return { from: a, to: Math.max(a, b), label: lab, kind };
    }
    default:
      return { from: startOfDay(d), to: endOfDay(d), label: "Today", kind: "today" };
  }
}
export const inRange = (ts: number, r: DateRange) => ts >= r.from && ts <= r.to;

// ── per-sale money helpers ──────────────────────────────────────
export const saleTotals = (s: Sale) =>
  computeInvoice(
    s.items.map((i) => ({ qty: i.qty, mrp: i.mrp, price: i.price, gst: i.gst })),
    s.discount,
  );
export const salePayable = (s: Sale) => saleTotals(s).payable;
export const validSales = (sales: Sale[]) => sales.filter((s) => s.status !== "cancelled");

// ── sales bucketing for charts (grain auto-picked from span) ────
export type Grain = "hour" | "day" | "week" | "month";
export type Bucket = {
  key: string;
  label: string;
  from: number;
  to: number;
  online: number;
  offline: number;
  bills: number;
  total: number;
};

const DAY_MS = 86400000;

/** Short ranges are drawn as hours, then days, then weeks, then months. */
export function grainOf(range: DateRange): Grain {
  const span = range.to - range.from;
  if (span <= 1.5 * DAY_MS) return "hour";
  if (span <= 35 * DAY_MS) return "day";
  if (span <= 130 * DAY_MS) return "week";
  return "month";
}
export const GRAIN_LABEL: Record<Grain, string> = {
  hour: "Hourly",
  day: "Day-wise",
  week: "Weekly",
  month: "Month-wise",
};

export function bucketSales(sales: Sale[], range: DateRange): Bucket[] {
  const grain = grainOf(range);
  const buckets: Bucket[] = [];
  const addBucket = (from: number, to: number, key: string, label: string) =>
    buckets.push({ key, label, from, to, online: 0, offline: 0, bills: 0, total: 0 });

  if (grain === "hour") {
    const day = new Date(range.from);
    for (let hour = 0; hour < 24; hour += 2) {
      const from = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour).getTime();
      if (from > range.to) break;
      const twoHours = 2 * 3600000;
      addBucket(from, from + twoHours - 1, "h" + hour, `${String(hour).padStart(2, "0")}h`);
    }
  } else if (grain === "day") {
    let cursor = new Date(range.from);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    while (cursor.getTime() <= range.to) {
      const from = cursor.getTime();
      addBucket(
        from,
        from + DAY_MS - 1,
        "d" + from,
        cursor.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      );
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
  } else if (grain === "week") {
    let cursor = new Date(range.from);
    const daysSinceMonday = (cursor.getDay() + 6) % 7;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - daysSinceMonday);
    while (cursor.getTime() <= range.to) {
      const from = cursor.getTime();
      addBucket(
        from,
        from + 7 * DAY_MS - 1,
        "w" + from,
        cursor.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      );
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
    }
  } else {
    let cursor = new Date(range.from);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    while (cursor.getTime() <= range.to) {
      const from = cursor.getTime();
      const to = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      ).getTime();
      const label =
        cursor.toLocaleDateString("en-IN", { month: "short" }) +
        " '" +
        String(cursor.getFullYear()).slice(2);
      addBucket(from, to, "m" + from, label);
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
  }

  for (const sale of sales) {
    if (sale.status === "cancelled" || !inRange(sale.createdAt, range)) continue;
    const bucket = buckets.find((row) => sale.createdAt >= row.from && sale.createdAt <= row.to);
    if (!bucket) continue;
    const payable = salePayable(sale);
    if (sale.channel === "online") bucket.online += payable;
    else bucket.offline += payable;
    bucket.bills += 1;
    bucket.total += payable;
  }
  return buckets;
}

// ── channel split + headline totals for a set of sales ──────────
export type SalesSummary = {
  total: number;
  online: number;
  offline: number;
  bills: number;
  onlineBills: number;
  offlineBills: number;
  tax: number;
  avg: number;
  items: number;
};
export function salesSummary(sales: Sale[]): SalesSummary {
  let total = 0,
    online = 0,
    offline = 0,
    tax = 0,
    items = 0,
    onlineBills = 0,
    offlineBills = 0;
  const kept = validSales(sales);
  for (const sale of kept) {
    const totals = saleTotals(sale);
    total += totals.payable;
    tax += totals.totalTax;
    items += sale.items.reduce((sum, item) => sum + item.qty, 0);
    if (sale.channel === "online") {
      online += totals.payable;
      onlineBills++;
    } else {
      offline += totals.payable;
      offlineBills++;
    }
  }
  return {
    total,
    online,
    offline,
    tax,
    items,
    bills: kept.length,
    onlineBills,
    offlineBills,
    avg: kept.length ? total / kept.length : 0,
  };
}

// ── GST slab summary (CGST + SGST split) ────────────────────────
export type GstSlabRow = { gst: number; taxable: number; cgst: number; sgst: number; tax: number };
export function gstSummary(sales: Sale[]): { rows: GstSlabRow[]; taxable: number; tax: number } {
  const byRate = new Map<number, { taxable: number; tax: number }>();
  for (const sale of validSales(sales)) {
    for (const line of saleTotals(sale).lines) {
      const slab = byRate.get(line.gst) ?? { taxable: 0, tax: 0 };
      slab.taxable += line.taxable;
      slab.tax += line.cgst + line.sgst;
      byRate.set(line.gst, slab);
    }
  }
  const rows = [...byRate.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([gst, slab]) => ({
      gst,
      taxable: slab.taxable,
      tax: slab.tax,
      cgst: slab.tax / 2,
      sgst: slab.tax / 2,
    }));
  return {
    rows,
    taxable: rows.reduce((sum, row) => sum + row.taxable, 0),
    tax: rows.reduce((sum, row) => sum + row.tax, 0),
  };
}

// ── top-selling products by revenue ─────────────────────────────
export function topProducts(
  sales: Sale[],
  inventory: InvProduct[],
  limit = 8,
): { id: string; name: string; rev: number; qty: number }[] {
  const revenueByProduct = new Map<string, number>();
  const qtyByProduct = new Map<string, number>();
  for (const sale of validSales(sales)) {
    for (const item of sale.items) {
      revenueByProduct.set(
        item.productId,
        (revenueByProduct.get(item.productId) ?? 0) + item.price * item.qty,
      );
      qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.qty);
    }
  }
  return [...revenueByProduct.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([id, revenue]) => ({
      id,
      name: inventory.find((product) => product.id === id)?.name ?? id,
      rev: revenue,
      qty: qtyByProduct.get(id) ?? 0,
    }));
}

// ── Namma MedMate settlement (receivable on online sales) ───────
// Online orders are collected by Namma MedMate, then settled to the pharmacy
// after deducting the platform commission (+ GST on it) and 1% TCS (e-commerce
// operator, u/s 52 — claimable). Funds settle on a T+SETTLE_DAYS cycle.
export const PLATFORM_COMMISSION = 0.08; // 8% of order value
export const PLATFORM_TCS = 0.01; // 1% TCS
export const SETTLE_DAYS = 7; // T+7 settlement
export type PayoutLine = {
  sale: Sale;
  gross: number;
  commission: number;
  commissionGst: number;
  tcs: number;
  net: number;
  settled: boolean;
  settleOn: number;
};
export function payoutOf(sale: Sale, now: number): PayoutLine {
  const gross = salePayable(sale);
  const commission = gross * PLATFORM_COMMISSION;
  const commissionGst = commission * GST_RATE;
  const tcs = gross * PLATFORM_TCS;
  const net = gross - commission - commissionGst - tcs;
  const settleOn = sale.createdAt + SETTLE_DAYS * DAY_MS;
  const settled = now >= settleOn && (sale.status === "delivered" || sale.status === "completed");
  return { sale, gross, commission, commissionGst, tcs, net, settled, settleOn };
}
export type PayoutSummary = {
  lines: PayoutLine[];
  gross: number;
  commission: number;
  commissionGst: number;
  tcs: number;
  net: number;
  settled: number;
  pending: number;
};
export function payoutSummary(sales: Sale[], now: number): PayoutSummary {
  const lines = validSales(sales)
    .filter((sale) => sale.channel === "online")
    .map((sale) => payoutOf(sale, now))
    .sort((left, right) => right.sale.createdAt - left.sale.createdAt);
  const sum = (amount: (line: PayoutLine) => number) =>
    lines.reduce((total, line) => total + amount(line), 0);
  return {
    lines,
    gross: sum((line) => line.gross),
    commission: sum((line) => line.commission),
    commissionGst: sum((line) => line.commissionGst),
    tcs: sum((line) => line.tcs),
    net: sum((line) => line.net),
    settled: lines.filter((line) => line.settled).reduce((total, line) => total + line.net, 0),
    pending: lines.filter((line) => !line.settled).reduce((total, line) => total + line.net, 0),
  };
}
