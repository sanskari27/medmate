export type DashboardRange = "7d" | "30d" | "12m";

export type DashboardBucket = {
  label: string;
  cash: string;
  credit: string;
  cashBills: number;
  creditBills: number;
  sales: string;
  purchases: string;
};

export type DashboardSnapshot = {
  range: DashboardRange;
  from: string;
  to: string;
  today: {
    netSales: string;
    bills: number;
    averageBill: string;
    units: number;
    cash: string;
    credit: string;
    spark: string[];
    returns: string;
    returnCount: number;
  };
  month: { netSales: string; purchases: string; expenses: string };
  dues: { bills: number; outstanding: string };
  stock: {
    low: number;
    expiring: number;
    out: number;
    cost: string;
    retail: string;
    attention: { name: string; onHand: number; reorder: number }[];
    expiringSoon: {
      name: string;
      batchNo: string;
      expiry: string;
      qty: number;
      months: number;
      expired: boolean;
    }[];
  };
  recent: { number: string; patient: string; payMode: string; payable: string }[];
  window: {
    buckets: DashboardBucket[];
    profit: { taxable: string; cogs: string; gross: string };
    expenses: { category: string; amount: string }[];
    collected: { cash: string; upi: string; card: string };
    topSellers: { name: string; qty: number; revenue: string }[];
    returns: string;
    margin: string;
  };
};

export function moneyNumber(amount: string) {
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function inr(amount: string | number) {
  const text = typeof amount === "number" ? amount.toFixed(2) : amount;
  const negative = text.startsWith("-");
  const body = Math.abs(moneyNumber(text)).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return negative ? `-₹${body}` : `₹${body}`;
}

export function payLabel(mode: string) {
  if (mode === "cash") return "Cash";
  if (mode === "credit") return "Credit";
  return mode;
}

export function greeting(now: Date, name: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const who = name.trim() || "there";
  return `${hello}, ${who}`;
}

export function kolkataDate(now: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
}
