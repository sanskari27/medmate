import { computeInvoice, fmtDateTime, inr, type PharmacyProfile, type Sale } from "@/utils";
import { buildReportPdf } from "@/utils/pdf";
import type { CustomerAccount, CustomerExportRow, CustomerSort } from "./Customers.types";

export function loyaltyPoints(spent: number): number {
  return Math.floor(spent / 100);
}

export function buildCustomerDirectory(sales: Sale[]): CustomerAccount[] {
  const accounts = new Map<string, CustomerAccount>();
  for (const sale of sales) {
    if (sale.status === "cancelled" || !sale.customer.name || sale.customer.name === "Kiosk (self-order)") continue;
    const isWalkIn = sale.customer.name === "Walk-in" && !sale.customer.phone;
    const key = isWalkIn ? "walkin" : (sale.customer.phone || sale.customer.name).trim();
    const current = accounts.get(key) ?? {
      key,
      name: isWalkIn ? "Walk-in customers" : sale.customer.name,
      phone: sale.customer.phone || "—",
      orders: [],
      spent: 0,
      units: 0,
      online: 0,
      offline: 0,
      last: 0,
      rx: false,
    };
    const totals = computeInvoice(sale.items, sale.discount);
    current.orders.push(sale);
    current.spent += totals.payable;
    current.units += sale.items.reduce(function addQuantity(sum, item) {
      return sum + item.qty;
    }, 0);
    if (sale.channel === "online") current.online += 1;
    else current.offline += 1;
    current.last = Math.max(current.last, sale.createdAt);
    current.rx = current.rx || sale.rx;
    if (!isWalkIn && sale.customer.phone) current.phone = sale.customer.phone;
    accounts.set(key, current);
  }
  return [...accounts.values()];
}

export function filterCustomers(customers: CustomerAccount[], query: string): CustomerAccount[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return customers;
  return customers.filter(function matchesQuery(customer) {
    return `${customer.name} ${customer.phone}`.toLowerCase().includes(needle);
  });
}

export function sortCustomers(customers: CustomerAccount[], sort: CustomerSort): CustomerAccount[] {
  return [...customers].sort(function bySort(left, right) {
    if (sort === "orders") return right.orders.length - left.orders.length;
    if (sort === "recent") return right.last - left.last;
    return right.spent - left.spent;
  });
}

export function summarizeCustomers(customers: CustomerAccount[]) {
  let totalSpent = 0;
  let named = 0;
  let repeat = 0;
  let chronic = 0;
  for (const customer of customers) {
    totalSpent += customer.spent;
    if (customer.key === "walkin") continue;
    named += 1;
    if (customer.orders.length > 1) repeat += 1;
    if (customer.rx) chronic += 1;
  }
  return { totalSpent, named, repeat, chronic };
}

export function creditOutreach(kind: "remind" | "invite", customerName: string, pharmacyName: string, outstanding: number): string {
  if (kind === "remind") {
    return `Hi ${customerName}, this is ${pharmacyName}. Your pending medicine credit (khata) balance is ${inr(outstanding)}. Kindly settle it at your convenience. Thank you!`;
  }
  return `Hi ${customerName}, this is ${pharmacyName}. You can now buy your medicines on credit (khata) and pay later. Just visit us or reply here to place an order.`;
}

export function repaymentAmount(entered: number, outstanding: number): number {
  return Math.min(entered, outstanding || entered);
}

export function aggregateCustomers(sales: Sale[]): CustomerExportRow[] {
  const rows = new Map<string, CustomerExportRow>();
  for (const sale of sales) {
    if (
      sale.status === "cancelled" ||
      !sale.customer.name ||
      sale.customer.name === "Walk-in" ||
      sale.customer.name === "Kiosk (self-order)"
    ) {
      continue;
    }
    const key = (sale.customer.phone || sale.customer.name).trim();
    if (!key) continue;
    const current = rows.get(key) ?? {
      name: sale.customer.name,
      phone: sale.customer.phone || "—",
      orders: 0,
      units: 0,
      online: 0,
      offline: 0,
      spent: 0,
      last: 0,
      rx: false,
    };
    const totals = computeInvoice(sale.items, sale.discount);
    current.orders += 1;
    current.spent += totals.payable;
    current.units += sale.items.reduce(function addQuantity(sum, item) {
      return sum + item.qty;
    }, 0);
    if (sale.channel === "online") current.online += 1;
    else current.offline += 1;
    current.last = Math.max(current.last, sale.createdAt);
    current.rx = current.rx || sale.rx;
    if (sale.customer.phone) current.phone = sale.customer.phone;
    rows.set(key, current);
  }
  return [...rows.values()].sort(function bySpent(left, right) {
    return right.spent - left.spent;
  });
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(function revokeUrl() {
    URL.revokeObjectURL(url);
  }, 6000);
}

function pad(value: unknown, width: number) {
  const text = String(value);
  return (text.length > width ? text.slice(0, width) : text).padEnd(width);
}

function padLeft(value: unknown, width: number) {
  const text = String(value);
  return (text.length > width ? text.slice(0, width) : text).padStart(width);
}

function rupeePlain(amount: number) {
  return "Rs " + Math.round(amount).toLocaleString("en-IN");
}

function stamp(now: number) {
  return new Date(now).toISOString().slice(0, 10);
}

export function exportCustomersCsv(rows: CustomerExportRow[], now: number) {
  const head = ["Name", "Phone", "Orders", "Units", "Online orders", "Counter orders", "On chronic Rx", "Last visit", "Loyalty points", "Lifetime value (Rs)"];
  const lines = rows.map(function toLine(customer) {
    return [
      customer.name,
      customer.phone,
      customer.orders,
      customer.units,
      customer.online,
      customer.offline,
      customer.rx ? "Yes" : "No",
      customer.last ? fmtDateTime(customer.last) : "—",
      loyaltyPoints(customer.spent),
      Math.round(customer.spent),
    ];
  });
  const csv = [head, ...lines]
    .map(function joinRow(row) {
      return row
        .map(function quoteCell(cell) {
          return `"${String(cell).replace(/"/g, '""')}"`;
        })
        .join(",");
    })
    .join("\n");
  downloadBlob(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }), `customers-${stamp(now)}.csv`);
}

export function exportCustomersPdf(rows: CustomerExportRow[], profile: PharmacyProfile, now: number) {
  const headerLine = pad("Customer", 22) + pad("Phone", 16) + padLeft("Orders", 7) + padLeft("Units", 7) + padLeft("Loyalty", 9) + padLeft("Lifetime", 12);
  const rowLines = rows.map(function toLine(customer) {
    return (
      pad(customer.name, 22) +
      pad(customer.phone, 16) +
      padLeft(customer.orders, 7) +
      padLeft(customer.units, 7) +
      padLeft(loyaltyPoints(customer.spent), 9) +
      padLeft(rupeePlain(customer.spent), 12)
    );
  });
  const totalSpent = rows.reduce(function addSpent(sum, customer) {
    return sum + customer.spent;
  }, 0);
  const totalsLine = pad(`TOTAL  ${rows.length} customers`, 61) + padLeft(rupeePlain(totalSpent), 12);
  const blob = buildReportPdf({
    title: "Customer Database",
    subtitle: `${rows.length} customers · lifetime value ${rupeePlain(totalSpent)}`,
    generatedAt: new Date(now).toLocaleString("en-IN"),
    profile,
    headerLine,
    rowLines,
    totalsLine,
  });
  downloadBlob(blob, `customers-${stamp(now)}.pdf`);
}

export function ordersNewestFirst(orders: Sale[]): Sale[] {
  return [...orders].sort(function byNewest(left, right) {
    return right.createdAt - left.createdAt;
  });
}
