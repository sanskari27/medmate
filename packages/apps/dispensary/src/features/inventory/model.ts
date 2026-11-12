export type InventoryAccess = {
  update: boolean;
  export: boolean;
  purchase: boolean;
};

export type InventoryBatch = {
  batchNo: string;
  expiry: string;
  qty: number;
  rate: string;
  mrp: string;
};

export type InventoryProduct = {
  productId: string;
  name: string;
  marketer: string | null;
  composition: string | null;
  form: string | null;
  pack: string | null;
  type: string | null;
  reorderLevel: number;
  rack: string | null;
  rackAlt: string | null;
  batches: InventoryBatch[];
};

export type InventoryFilter = "all" | "low" | "out" | "expiring";

export function canOpenInventory(
  role: string | null | undefined,
  permissions: string[] | undefined,
) {
  return role === "owner" || (permissions ?? []).includes("inventory:read");
}

export function inventoryAccess(
  role: string | null | undefined,
  permissions: string[] | undefined,
): InventoryAccess {
  const owner = role === "owner";
  const keys = permissions ?? [];
  return {
    update: owner || keys.includes("inventory:update"),
    export: owner || keys.includes("inventory:export"),
    purchase: owner || (keys.includes("purchases:read") && keys.includes("purchases:create")),
  };
}

export function locationLabel(product: Pick<InventoryProduct, "rack" | "rackAlt">) {
  const codes = [product.rack, product.rackAlt]
    .map((code) => (code ?? "").trim())
    .filter((code) => code.length > 0);
  return codes.length > 0 ? codes.join(" · ") : "—";
}

export function units(product: InventoryProduct): number {
  return product.batches.reduce((sum, batch) => sum + batch.qty, 0);
}

export function cost(product: InventoryProduct): number {
  return product.batches.reduce((sum, batch) => sum + Number(batch.rate) * batch.qty, 0);
}

export function retail(product: InventoryProduct): number {
  return product.batches.reduce((sum, batch) => sum + Number(batch.mrp) * batch.qty, 0);
}

export function nearestExpiry(product: InventoryProduct): string | null {
  const dates = product.batches.filter((batch) => batch.qty > 0).map((batch) => batch.expiry);
  return dates.sort()[0] ?? null;
}

export function isOut(product: InventoryProduct): boolean {
  return units(product) === 0;
}

export function isLow(product: InventoryProduct): boolean {
  return units(product) > 0 && Math.round(cost(product)) < 1000;
}

export function tableComposition(composition: string | null): string | null {
  if (!composition) return composition;
  return composition.slice(0, 50);
}

export type ExpiryTone = "rose" | "gold" | "gray";

export function expiryTone(expiry: string, today = new Date()): ExpiryTone {
  const index = monthIndex(expiry);
  const current = monthIndex(kolkata(today));
  if (!Number.isFinite(index) || !Number.isFinite(current)) return "gray";
  if (index < current) return "rose";
  if (index <= current + 4) return "gold";
  return "gray";
}

export function expiryLabel(expiry: string, today = new Date()): string {
  const tone = expiryTone(expiry, today);
  if (tone === "rose") return `${expiry} · exp`;
  if (tone === "gold") return `${expiry} · ${monthIndex(expiry) - monthIndex(kolkata(today))}mo`;
  return expiry;
}

export function isExpiring(product: InventoryProduct, today = new Date()): boolean {
  const limit = monthIndex(kolkata(today)) + 4;
  return product.batches.some((batch) => batch.qty > 0 && monthIndex(batch.expiry) <= limit);
}

export function expiringCost(product: InventoryProduct, today = new Date()): number {
  const limit = monthIndex(kolkata(today)) + 4;
  return product.batches
    .filter((batch) => batch.qty > 0 && monthIndex(batch.expiry) <= limit)
    .reduce((sum, batch) => sum + Number(batch.rate) * batch.qty, 0);
}

export function matches(
  product: InventoryProduct,
  filter: InventoryFilter,
  query: string,
  today = new Date(),
): boolean {
  const text = query.trim().toLowerCase();
  const haystack =
    `${product.name} ${product.composition ?? ""} ${product.marketer ?? ""}`.toLowerCase();
  if (text && !haystack.includes(text)) return false;
  if (filter === "low") return isLow(product);
  if (filter === "out") return isOut(product);
  if (filter === "expiring") return isExpiring(product, today);
  return true;
}

export function inr(amount: number): string {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}

export function inventoryCsv(products: InventoryProduct[]): string {
  const rows = ["Product,Type,Batches,Expiry,Stock,MRP,Value"];
  for (const product of products) {
    const visible = product.batches.filter((batch) => batch.qty > 0);
    rows.push(
      [
        product.name,
        product.type ?? "",
        String(visible.length),
        nearestExpiry(product) ?? "",
        String(units(product)),
        visible[0]?.mrp ?? "",
        cost(product).toFixed(2),
      ]
        .map((cell) => `"${cell.replaceAll('"', '""')}"`)
        .join(","),
    );
  }
  return rows.join("\n");
}

function kolkata(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(date);
}

function monthIndex(value: string): number {
  const [year, month] = value.split("-").map(Number);
  return year * 12 + month;
}
