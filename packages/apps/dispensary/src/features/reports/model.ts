export function canOpenReports(role: string | null | undefined, permissions: string[] | undefined) {
  return role === "owner" || (permissions ?? []).includes("reports:read");
}

export function canExportReports(role: string | null | undefined, permissions: string[] | undefined) {
  return role === "owner" || (permissions ?? []).includes("reports:export");
}

export const SNAPSHOT_REPORTS = new Set([
  "low-stock",
  "rate-list",
  "stock-detail",
  "stock-summary",
  "receivable-ageing",
  "party-outstanding",
]);

export type ReportPreset = "today" | "month" | "year" | "prev-year" | "fy" | "prev-fy" | "custom" | "all";

export const REPORT_PRESETS: { key: ReportPreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "prev-year", label: "Previous year" },
  { key: "fy", label: "This FY" },
  { key: "prev-fy", label: "Previous FY" },
  { key: "custom", label: "Custom" },
  { key: "all", label: "All" },
];

export type ReportCell = string | number;

export type ReportColumn = {
  key: string;
  label: string;
  money: boolean;
  num: boolean;
};

export type ReportBody = {
  id: string;
  name: string;
  description: string;
  from: string;
  to: string;
  label: string;
  columns: ReportColumn[];
  rows: ReportCell[][];
  totals: ReportCell[] | null;
  note: string | null;
};

export function kolkataDate(now: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function reportRange(
  preset: ReportPreset,
  today: string,
  customFrom = "",
  customTo = "",
): { from: string; to: string } | null {
  const [year, month] = today.split("-").map(Number);
  if (!year || !month) return null;
  if (preset === "today") return { from: today, to: today };
  if (preset === "month") {
    return { from: iso(year, month, 1), to: iso(year, month, lastDay(year, month)) };
  }
  if (preset === "year") return { from: iso(year, 1, 1), to: iso(year, 12, 31) };
  if (preset === "prev-year") return { from: iso(year - 1, 1, 1), to: iso(year - 1, 12, 31) };
  if (preset === "fy") {
    const startYear = month >= 4 ? year : year - 1;
    return { from: iso(startYear, 4, 1), to: iso(startYear + 1, 3, 31) };
  }
  if (preset === "prev-fy") {
    const startYear = (month >= 4 ? year : year - 1) - 1;
    return { from: iso(startYear, 4, 1), to: iso(startYear + 1, 3, 31) };
  }
  if (preset === "all") return { from: "2000-01-01", to: today };
  if (!customFrom || !customTo) return null;
  return { from: customFrom, to: customTo };
}

export function inr(amount: string) {
  const negative = amount.startsWith("-");
  const body = (Math.abs(toPaise(amount)) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return negative ? `-₹${body}` : `₹${body}`;
}

export function reportCell(value: ReportCell, money: boolean) {
  if (typeof value === "number") return value.toLocaleString("en-IN");
  if (money && value !== "") return inr(value);
  return value;
}

export function downloadFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function lastDay(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function toPaise(amount: string) {
  const [rupees, paise = ""] = amount.replace("-", "").split(".");
  const whole = Number(rupees || "0");
  const fraction = Number(paise.padEnd(2, "0").slice(0, 2) || "0");
  if (!Number.isFinite(whole) || !Number.isFinite(fraction)) return 0;
  return whole * 100 + fraction;
}
