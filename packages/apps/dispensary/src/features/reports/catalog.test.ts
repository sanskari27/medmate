import { describe, expect, it } from "vitest";
import {
  REPORT_CATALOG,
  REPORT_COLUMNS,
  columnReports,
  matchingReports,
  type ReportFilter,
} from "./catalog";

function ids(filter: ReportFilter | null, query = "") {
  return matchingReports(query, filter).map((report) => report.id);
}

describe("report catalog", () => {
  it("lists the pharmacy names and keeps favourites in their own column", () => {
    expect(REPORT_CATALOG.map((report) => report.name)).toEqual([
      "GSTR-1 (Sales)",
      "Profit And Loss Report",
      "Sales Summary",
      "GSTR-2 (Purchase)",
      "GSTR-3b",
      "Audit Trail",
      "Bill Wise Profit",
      "Cash and Bank Report (All Payments)",
      "Daybook",
      "Expense Category Report",
      "Expense Transaction Report",
      "Purchase Summary",
      "Item Report By Party",
      "Item Sales and Purchase Summary",
      "Low Stock Summary",
      "Rate List",
      "Stock Detail Report",
      "Stock Summary",
      "Receivable Ageing Report",
      "Party Report By Item",
      "Party Statement (Ledger)",
      "Party Wise Outstanding",
      "Sales Summary - Category Wise",
    ]);
    expect(REPORT_COLUMNS).toEqual(["favourite", "gst", "transaction", "item", "party"]);
    const favourite = columnReports(REPORT_CATALOG, "favourite").map((report) => report.name);
    expect(favourite).toEqual(["GSTR-1 (Sales)", "Profit And Loss Report", "Sales Summary"]);
    expect(columnReports(REPORT_CATALOG, "gst").map((report) => report.id)).not.toContain("gstr1");
  });

  it("filters by party, category, payment, item, invoice, and summary", () => {
    expect(ids("Party")).toEqual([
      "receivable-ageing",
      "party-by-item",
      "party-ledger",
      "party-outstanding",
      "sales-category-wise",
    ]);
    expect(ids("Category")).toEqual([
      "expense-category",
      "item-by-party",
      "item-sales-purchase",
      "low-stock",
      "rate-list",
      "stock-detail",
      "stock-summary",
      "sales-category-wise",
    ]);
    expect(ids("Payment Collection")).toEqual([
      "cash-bank",
      "receivable-ageing",
      "party-ledger",
      "party-outstanding",
    ]);
    expect(ids("Item")).toEqual([
      "item-by-party",
      "item-sales-purchase",
      "low-stock",
      "rate-list",
      "stock-detail",
      "stock-summary",
    ]);
    expect(ids("Invoice Details")).toEqual([
      "gstr1",
      "sales-summary",
      "audit-trail",
      "bill-wise-profit",
      "purchase-summary",
    ]);
    expect(ids("Summary")).toEqual([
      "gstr1",
      "pnl",
      "sales-summary",
      "purchase-summary",
      "item-sales-purchase",
      "low-stock",
      "stock-summary",
      "sales-category-wise",
    ]);
    expect(ids(null, "slab-wise")).toEqual(["gstr1", "gstr2"]);
  });
});
