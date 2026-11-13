export type ReportCat = "favourite" | "gst" | "transaction" | "item" | "party";

export type ReportMeta = {
  id: string;
  name: string;
  cat: ReportCat;
  fav?: boolean;
  desc: string;
};

export const REPORT_CATALOG: ReportMeta[] = [
  {
    id: "gstr1",
    name: "GSTR-1 (Sales)",
    cat: "favourite",
    fav: true,
    desc: "Outward supplies, slab-wise",
  },
  {
    id: "pnl",
    name: "Profit And Loss Report",
    cat: "favourite",
    fav: true,
    desc: "Income, COGS & gross profit",
  },
  {
    id: "sales-summary",
    name: "Sales Summary",
    cat: "favourite",
    fav: true,
    desc: "Sales dashboard & trends",
  },
  { id: "gstr2", name: "GSTR-2 (Purchase)", cat: "gst", desc: "Inward supplies, slab-wise" },
  { id: "gstr3b", name: "GSTR-3b", cat: "gst", desc: "Output vs input — net GST" },
  {
    id: "audit-trail",
    name: "Audit Trail",
    cat: "transaction",
    desc: "Every document, time-stamped",
  },
  {
    id: "bill-wise-profit",
    name: "Bill Wise Profit",
    cat: "transaction",
    desc: "Profit & margin per invoice",
  },
  {
    id: "cash-bank",
    name: "Cash and Bank Report (All Payments)",
    cat: "transaction",
    desc: "Collections by mode",
  },
  { id: "daybook", name: "Daybook", cat: "transaction", desc: "Net sales vs purchases per day" },
  {
    id: "expense-category",
    name: "Expense Category Report",
    cat: "transaction",
    desc: "Expenses grouped by head",
  },
  {
    id: "expense-transaction",
    name: "Expense Transaction Report",
    cat: "transaction",
    desc: "Every expense entry",
  },
  {
    id: "purchase-summary",
    name: "Purchase Summary",
    cat: "transaction",
    desc: "GRN-wise inward purchases",
  },
  { id: "item-by-party", name: "Item Report By Party", cat: "item", desc: "Who bought each item" },
  {
    id: "item-sales-purchase",
    name: "Item Sales and Purchase Summary",
    cat: "item",
    desc: "Sold vs purchased per item",
  },
  { id: "low-stock", name: "Low Stock Summary", cat: "item", desc: "Items at/under reorder level" },
  { id: "rate-list", name: "Rate List", cat: "item", desc: "MRP & sale price per item" },
  {
    id: "stock-detail",
    name: "Stock Detail Report",
    cat: "item",
    desc: "Batch-wise stock & expiry",
  },
  { id: "stock-summary", name: "Stock Summary", cat: "item", desc: "Stock & value per item" },
  {
    id: "receivable-ageing",
    name: "Receivable Ageing Report",
    cat: "party",
    desc: "Outstanding by age bucket",
  },
  {
    id: "party-by-item",
    name: "Party Report By Item",
    cat: "party",
    desc: "What each party bought",
  },
  {
    id: "party-ledger",
    name: "Party Statement (Ledger)",
    cat: "party",
    desc: "Billed, paid & outstanding",
  },
  { id: "party-outstanding", name: "Party Wise Outstanding", cat: "party", desc: "Dues per party" },
  {
    id: "sales-category-wise",
    name: "Sales Summary - Category Wise",
    cat: "party",
    desc: "Sales grouped by category",
  },
];

export const REPORT_COLUMNS: ReportCat[] = ["favourite", "gst", "transaction", "item", "party"];

export const COLUMN_LABEL: Record<ReportCat, string> = {
  favourite: "Favourite",
  gst: "GST",
  transaction: "Transaction",
  item: "Item",
  party: "Party",
};

export const REPORT_FILTERS = [
  "Party",
  "Category",
  "Payment Collection",
  "Item",
  "Invoice Details",
  "Summary",
] as const;

export type ReportFilter = (typeof REPORT_FILTERS)[number];

const PAYMENT_IDS = new Set([
  "cash-bank",
  "receivable-ageing",
  "party-outstanding",
  "party-ledger",
]);

const INVOICE_IDS = new Set([
  "audit-trail",
  "bill-wise-profit",
  "gstr1",
  "sales-summary",
  "purchase-summary",
]);

export function matchesFilter(report: ReportMeta, filter: ReportFilter | null) {
  if (!filter) return true;
  if (filter === "Party") return report.cat === "party";
  if (filter === "Category") return /categor/i.test(report.name) || report.cat === "item";
  if (filter === "Payment Collection") return PAYMENT_IDS.has(report.id);
  if (filter === "Item") return report.cat === "item";
  if (filter === "Invoice Details") return INVOICE_IDS.has(report.id);
  return /summary/i.test(report.name) || report.fav === true;
}

export function matchingReports(query: string, filter: ReportFilter | null) {
  const needle = query.trim().toLowerCase();
  return REPORT_CATALOG.filter((report) => {
    const text =
      !needle ||
      report.name.toLowerCase().includes(needle) ||
      report.desc.toLowerCase().includes(needle);
    return text && matchesFilter(report, filter);
  });
}

export function columnReports(reports: ReportMeta[], cat: ReportCat) {
  if (cat === "favourite") return reports.filter((report) => report.fav);
  return reports.filter((report) => report.cat === cat && !report.fav);
}
