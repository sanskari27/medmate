import type { InventoryProduct } from "@/features/inventory";

export type RackAccess = {
  create: boolean;
  update: boolean;
  export: boolean;
};

export type RackGroup = {
  code: string;
  zone: string;
  items: InventoryProduct[];
};

export function canOpenRacks(role: string | null | undefined, permissions: string[] | undefined) {
  return role === "owner" || (permissions ?? []).includes("racks:read");
}

export function racksAccess(
  role: string | null | undefined,
  permissions: string[] | undefined,
): RackAccess {
  const owner = role === "owner";
  const keys = permissions ?? [];
  return {
    create: owner || keys.includes("racks:create"),
    update: owner || keys.includes("racks:update"),
    export: owner || keys.includes("racks:export"),
  };
}

export function normalizeRack(code: string | null | undefined) {
  return (code ?? "").trim().toUpperCase();
}

export function composeRack(rack: string, shelf: string, bin: string) {
  const letter = rack.trim().toUpperCase();
  const shelfCode = shelf.trim();
  const binCode = bin.trim();
  if (!letter) return "";
  return `${letter}${shelfCode}${binCode ? `-${binCode}` : ""}`;
}

export function rackZone(code: string) {
  const trimmed = code.trim();
  const leadingLetters = trimmed.match(/^[A-Za-z]+/);
  const leadingToken = leadingLetters ?? trimmed.match(/^[^\s\-_/.]+/);
  return (leadingToken ? leadingToken[0] : trimmed).toUpperCase();
}

export function locationCodes(product: Pick<InventoryProduct, "rack" | "rackAlt">) {
  return [product.rack, product.rackAlt].map((code) => (code ?? "").trim()).filter(Boolean);
}

export function hasLocation(product: Pick<InventoryProduct, "rack">) {
  return Boolean(product.rack && product.rack.trim());
}

export function units(product: InventoryProduct) {
  return product.batches.reduce((sum, batch) => sum + batch.qty, 0);
}

export function unassignedProducts(products: InventoryProduct[]) {
  return products.filter((product) => !hasLocation(product));
}

export function groupByLocation(products: InventoryProduct[], registry: string[]): RackGroup[] {
  const medicinesByCode = new Map<string, InventoryProduct[]>();
  for (const saved of registry) {
    const code = normalizeRack(saved);
    if (code && !medicinesByCode.has(code)) medicinesByCode.set(code, []);
  }
  for (const product of products) {
    const code = normalizeRack(product.rack);
    if (!code) continue;
    const medicines = medicinesByCode.get(code) ?? [];
    medicines.push(product);
    medicinesByCode.set(code, medicines);
  }
  return [...medicinesByCode.entries()]
    .map(([code, items]) => ({ code, zone: rackZone(code), items }))
    .sort((left, right) =>
      left.code.localeCompare(right.code, undefined, { numeric: true, sensitivity: "base" }),
    );
}

export function matchesRack(product: InventoryProduct, term: string) {
  const text = term.trim().toLowerCase();
  if (!text) return true;
  const haystack =
    `${product.name} ${product.composition ?? ""} ${product.marketer ?? ""}`.toLowerCase();
  return (
    haystack.includes(text) ||
    locationCodes(product).some((code) => code.toLowerCase().includes(text))
  );
}

type AuditRow = {
  rack: string;
  alt: string;
  name: string;
  batch: string;
  cells: string[];
};

export function auditCsv(products: InventoryProduct[], today = new Date()) {
  const rows: AuditRow[] = [];
  for (const product of products) {
    const batches = product.batches.length > 0 ? product.batches : [emptyBatch];
    for (const batch of batches) {
      const status = batch.expiry ? auditStatus(batch.expiry, today) : { months: "", status: "" };
      const qty = batch.qty;
      const rate = Number(batch.rate);
      const mrp = Number(batch.mrp);
      rows.push({
        rack: normalizeRack(product.rack) || "UNASSIGNED",
        alt: normalizeRack(product.rackAlt),
        name: product.name,
        batch: batch.batchNo,
        cells: [
          normalizeRack(product.rack) || "UNASSIGNED",
          normalizeRack(product.rackAlt),
          product.name,
          product.composition ?? "",
          product.marketer ?? "",
          product.pack ?? "",
          product.form ?? "",
          product.type ?? "",
          batch.batchNo,
          batch.expiry,
          status.months,
          status.status,
          String(qty),
          batch.rate,
          batch.mrp,
          money(rate, qty),
          money(mrp, qty),
        ],
      });
    }
  }
  rows.sort(
    (left, right) =>
      left.rack.localeCompare(right.rack, undefined, { numeric: true, sensitivity: "base" }) ||
      left.name.localeCompare(right.name) ||
      left.batch.localeCompare(right.batch),
  );
  const header = [
    "Rack",
    "2nd slot",
    "Medicine",
    "Composition",
    "Marketer",
    "Pack",
    "Form",
    "Type",
    "Batch no.",
    "Expiry",
    "Months to expiry",
    "Status",
    "Qty",
    "Rate",
    "MRP",
    "Cost value",
    "Retail value",
  ];
  return [header, ...rows.map((row) => row.cells)]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
}

const emptyBatch = { batchNo: "", expiry: "", qty: 0, rate: "", mrp: "" };

function money(amount: number, qty: number) {
  if (!Number.isFinite(amount)) return "";
  return (amount * qty).toFixed(2);
}

function auditStatus(expiry: string, today: Date) {
  const months = monthIndex(expiry) - monthIndex(kolkata(today));
  if (!Number.isFinite(months)) return { months: "", status: "" };
  if (months < 0) return { months: String(months), status: "Expired" };
  if (months <= 4) return { months: String(months), status: `Expiring (${months}mo)` };
  return { months: String(months), status: "OK" };
}

function kolkata(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

function monthIndex(value: string) {
  const [year, month] = value.split("-").map(Number);
  return year * 12 + month;
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
