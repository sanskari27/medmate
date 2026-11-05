import {
  channelLabel,
  computeInvoice,
  fmtDateTime,
  PAY_LABEL,
  STATUS_LABEL,
  type PharmacyProfile,
  type Sale,
} from "@/utils";
import { buildReportPdf } from "@/utils/pdf";
import type { PaidFilter, SalesQuery, SalesSortKey, SortDirection } from "./Sales.types";

export type SalesRow = { sale: Sale; totals: ReturnType<typeof computeInvoice> };

export function selectSales(sales: Sale[], query: SalesQuery, inWindow: (createdAt: number) => boolean): SalesRow[] {
  const needle = query.searchQuery.trim().toLowerCase();
  const rows = sales
    .filter(function openInWindow(sale) {
      return sale.status !== "cancelled" && inWindow(sale.createdAt);
    })
    .map(function withTotals(sale): SalesRow {
      return { sale, totals: computeInvoice(sale.items, sale.discount) };
    })
    .filter(function matches(row) {
      return rowMatches(row.sale, query, needle);
    });
  rows.sort(function byColumn(left, right) {
    return compareRows(left, right, query.sort, query.direction);
  });
  return rows;
}

export function summarizeSales(rows: SalesRow[]) {
  return {
    gross: rows.reduce(function addGross(sum, row) {
      return sum + row.totals.gross;
    }, 0),
    tax: rows.reduce(function addTax(sum, row) {
      return sum + row.totals.totalTax;
    }, 0),
    net: rows.reduce(function addNet(sum, row) {
      return sum + row.totals.payable;
    }, 0),
    units: rows.reduce(function addUnits(sum, row) {
      return sum + unitCount(row.sale);
    }, 0),
  };
}

export function nextSalesSort(sort: SalesSortKey, direction: SortDirection, key: SalesSortKey) {
  if (sort === key) return { sort, direction: direction === "asc" ? "desc" : "asc" } as const;
  return { sort: key, direction: "desc" } as const;
}

export function sortMarker(active: boolean, direction: SortDirection) {
  if (!active) return "";
  return direction === "asc" ? "▲" : "▼";
}

export function salesFileSlug(label: string) {
  return label.replace(/[^A-Za-z0-9]+/g, "-");
}

export function salesCsv(rows: SalesRow[]) {
  const head = [
    "Date",
    "Invoice",
    "Customer",
    "Phone",
    "Channel",
    "Units",
    "Payment",
    "Status",
    "Paid",
    "Discount",
    "Taxable",
    "GST",
    "Total",
  ];
  const lines = rows.map(function toLine(row) {
    const { sale, totals } = row;
    return [
      fmtDateTime(sale.createdAt),
      sale.id,
      sale.customer.name,
      sale.customer.phone ?? "",
      channelLabel(sale.channel),
      unitCount(sale),
      sale.paid === false ? "" : PAY_LABEL[sale.payMode],
      STATUS_LABEL[sale.status],
      sale.paid === false ? "Unpaid" : "Paid",
      totals.discount,
      totals.taxable.toFixed(2),
      totals.totalTax.toFixed(2),
      totals.payable,
    ];
  });
  return [head, ...lines]
    .map(function joinRow(cells: Array<string | number>) {
      return cells.map(function quote(cell) {
        return `"${String(cell).replace(/"/g, '""')}"`;
      }).join(",");
    })
    .join("\n");
}

export function salesPdfBlob(
  rows: SalesRow[],
  summary: ReturnType<typeof summarizeSales>,
  label: string,
  profile: PharmacyProfile,
) {
  const headerLine =
    pad("Date", 16) + pad("Invoice", 10) + pad("Customer", 20) + pad("Chnl", 8) + pad("Status", 11) + padLeft("GST", 9) + padLeft("Total", 12);
  const rowLines = rows.map(function toPdf(row) {
    const { sale, totals } = row;
    return (
      pad(shortWhen(sale.createdAt), 16) +
      pad(sale.id, 10) +
      pad(sale.customer.name, 20) +
      pad(channelLabel(sale.channel), 8) +
      pad(sale.paid === false ? "UNPAID" : STATUS_LABEL[sale.status], 11) +
      padLeft(rupees(totals.totalTax), 9) +
      padLeft(rupees(totals.payable), 12)
    );
  });
  const totalsLine = pad(`TOTAL  ${rows.length} sales  ${summary.units} units`, 54) + padLeft(rupees(summary.tax), 9) + padLeft(rupees(summary.net), 12);
  return buildReportPdf({
    title: "Sales Report",
    subtitle: `Period: ${label}`,
    generatedAt: new Date().toLocaleString("en-IN"),
    profile,
    headerLine,
    rowLines,
    totalsLine,
  });
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(function release() {
    URL.revokeObjectURL(url);
  }, 6000);
}

export function unitCount(sale: Sale) {
  return sale.items.reduce(function add(sum, item) {
    return sum + item.qty;
  }, 0);
}

function rowMatches(sale: Sale, query: SalesQuery, needle: string) {
  if (query.channel !== "all" && sale.channel !== query.channel) return false;
  if (query.payMode !== "all" && sale.payMode !== query.payMode) return false;
  if (query.status !== "all" && sale.status !== query.status) return false;
  if (query.paid === "paid" && sale.paid === false) return false;
  if (query.paid === "unpaid" && sale.paid !== false) return false;
  if (needle && !`${sale.id} ${sale.customer.name} ${sale.customer.phone ?? ""}`.toLowerCase().includes(needle)) return false;
  return true;
}

function compareRows(left: SalesRow, right: SalesRow, sort: SalesSortKey, direction: SortDirection) {
  const sign = direction === "asc" ? 1 : -1;
  if (sort === "total") return (left.totals.payable - right.totals.payable) * sign;
  if (sort === "items") return (unitCount(left.sale) - unitCount(right.sale)) * sign;
  if (sort === "customer") return left.sale.customer.name.localeCompare(right.sale.customer.name) * sign;
  return (left.sale.createdAt - right.sale.createdAt) * sign;
}

function pad(value: unknown, width: number) {
  const text = String(value);
  return (text.length > width ? text.slice(0, width) : text).padEnd(width);
}

function padLeft(value: unknown, width: number) {
  const text = String(value);
  return (text.length > width ? text.slice(0, width) : text).padStart(width);
}

function rupees(amount: number) {
  return "Rs " + Math.round(amount).toLocaleString("en-IN");
}

function shortWhen(createdAt: number) {
  return new Date(createdAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type { PaidFilter };
