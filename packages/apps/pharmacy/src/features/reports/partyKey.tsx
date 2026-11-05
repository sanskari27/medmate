import {
  Sale, Purchase, InvProduct, PharmacyProfile, Expense, validSales,
  saleTotals, purchaseTotals, payoutSummary, PAY_LABEL, PayMode, STATUS_LABEL,
  catLabel, stockOf, stockValue, looseUnitsOf, mrpOf, sellPrice,
  isLowStock, isExpired, monthsToExpiry, earliestBatch, fmtDateTime, OrderStatus,
  expenseTaxable, expenseTax,
} from "@/domain";

export type RangeLite = { from: number; to: number; label: string };

export type ReportCat = "favourite" | "gst" | "transaction" | "item" | "party";

export type ReportMeta = { id: string; name: string; cat: ReportCat; fav?: boolean; analytics?: "overview" | "accounts"; desc: string };

export type RCol = { key: string; label: string; money?: boolean; num?: boolean };

export type ReportResult = { columns: RCol[]; rows: (string | number)[][]; totals?: (string | number)[]; note?: string };

export type ReportCtx = { sales: Sale[]; purchases: Purchase[]; inventory: InvProduct[]; expenses?: Expense[]; profile: PharmacyProfile; now: number; range: RangeLite };

export const REPORT_CATALOG: ReportMeta[] = [
  // favourites
  { id: "balance-sheet", name: "Balance Sheet", cat: "favourite", fav: true, desc: "Assets vs liabilities snapshot" },
  { id: "gstr1", name: "GSTR-1 (Sales)", cat: "favourite", fav: true, desc: "Outward supplies, slab-wise" },
  { id: "pnl", name: "Profit And Loss Report", cat: "favourite", fav: true, analytics: "accounts", desc: "Income, COGS & gross profit" },
  { id: "sales-summary", name: "Sales Summary", cat: "favourite", fav: true, analytics: "overview", desc: "Sales dashboard & trends" },
  // GST
  { id: "gstr2", name: "GSTR-2 (Purchase)", cat: "gst", desc: "Inward supplies, slab-wise" },
  { id: "gstr3b", name: "GSTR-3b", cat: "gst", desc: "Output vs input — net GST" },
  { id: "gst-purchase-hsn", name: "GST Purchase (With HSN)", cat: "gst", desc: "Purchases grouped by HSN" },
  { id: "gst-sales-hsn", name: "GST Sales (With HSN)", cat: "gst", desc: "Sales grouped by HSN" },
  { id: "hsn-sales-summary", name: "HSN Wise Sales Summary", cat: "gst", desc: "Qty & value by HSN code" },
  { id: "tds-payable", name: "TDS Payable", cat: "gst", desc: "Tax deducted, payable" },
  { id: "tds-receivable", name: "TDS Receivable", cat: "gst", desc: "Tax deducted by others" },
  { id: "tcs-payable", name: "TCS Payable", cat: "gst", desc: "Tax collected at source, payable" },
  { id: "tcs-receivable", name: "TCS Receivable", cat: "gst", desc: "TCS withheld by Namma MedMate (u/s 52)" },
  // transaction
  { id: "audit-trail", name: "Audit Trail", cat: "transaction", desc: "Every document, time-stamped" },
  { id: "bill-wise-profit", name: "Bill Wise Profit", cat: "transaction", desc: "Profit & margin per invoice" },
  { id: "cash-bank", name: "Cash and Bank Report (All Payments)", cat: "transaction", desc: "Collections by mode" },
  { id: "daybook", name: "Daybook", cat: "transaction", desc: "Net sales vs purchases per day" },
  { id: "expense-category", name: "Expense Category Report", cat: "transaction", desc: "Expenses grouped by head" },
  { id: "expense-transaction", name: "Expense Transaction Report", cat: "transaction", desc: "Every expense entry" },
  { id: "purchase-summary", name: "Purchase Summary", cat: "transaction", desc: "GRN-wise inward purchases" },
  // item
  { id: "item-by-party", name: "Item Report By Party", cat: "item", desc: "Who bought each item" },
  { id: "item-sales-purchase", name: "Item Sales and Purchase Summary", cat: "item", desc: "Sold vs purchased per item" },
  { id: "low-stock", name: "Low Stock Summary", cat: "item", desc: "Items at/under reorder level" },
  { id: "rate-list", name: "Rate List", cat: "item", desc: "MRP & sale price per item" },
  { id: "stock-detail", name: "Stock Detail Report", cat: "item", desc: "Batch-wise stock & expiry" },
  { id: "stock-summary", name: "Stock Summary", cat: "item", desc: "Stock & value per item" },
  // party
  { id: "receivable-ageing", name: "Receivable Ageing Report", cat: "party", desc: "Outstanding by age bucket" },
  { id: "party-by-item", name: "Party Report By Item", cat: "party", desc: "What each party bought" },
  { id: "party-ledger", name: "Party Statement (Ledger)", cat: "party", desc: "Billed, paid & outstanding" },
  { id: "party-outstanding", name: "Party Wise Outstanding", cat: "party", desc: "Dues per party" },
  { id: "sales-category-wise", name: "Sales Summary - Category Wise", cat: "party", desc: "Sales grouped by category" },
];

export const CAT_LABEL: Record<ReportCat, string> = { favourite: "Favourite", gst: "GST", transaction: "Transaction", item: "Item", party: "Party" };

export const partyKey = (s: Sale) => s.customer.name + (s.customer.phone ? ` · ${s.customer.phone}` : "");
