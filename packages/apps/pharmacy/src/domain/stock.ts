// ── drug schedule (regulatory) ──────────────────────────────────
// OTC = over-the-counter, H/H1 = prescription-only (H1 = extra register),
// X = highly regulated (psychotropics etc.)
export type Schedule = "OTC" | "H" | "H1" | "X";
export const SCHEDULE_META: Record<Schedule, { label: string; rx: boolean; note: string }> = {
  OTC: { label: "OTC", rx: false, note: "Over the counter — no prescription needed" },
  H:   { label: "Sch. H", rx: true, note: "Prescription required" },
  H1:  { label: "Sch. H1", rx: true, note: "Prescription + H1 register entry" },
  X:   { label: "Sch. X", rx: true, note: "Highly regulated — duplicate Rx & register" },
};

export type DosageForm = "Tablet" | "Capsule" | "Syrup" | "Drops" | "Injection" | "Cream" | "Device" | "Other";

// A purchased lot of a product. Stock & expiry are tracked per batch.
export type Batch = {
  batchNo: string;
  expiry: string;      // "YYYY-MM"
  qty: number;         // units in this batch
  mrp: number;         // printed MRP (GST-inclusive)
  ptr: number;         // price-to-retailer (cost)
};

export type InvProduct = {
  id: string;
  name: string;
  composition: string;     // salt / molecule
  manufacturer: string;
  form: DosageForm;
  pack: string;            // "Strip of 15 tablets"
  category: string;        // category key (see CATEGORIES)
  hsn: string;             // HSN code for GST
  gst: number;             // GST % (0 / 5 / 12 / 18)
  schedule: Schedule;
  rack: string;            // primary rack/bin location code (e.g. "A3-12") — matches the physical label
  rackAlt?: string;        // optional 2nd slot for overflow / bulk stock
  reorderLevel: number;    // low-stock threshold (units)
  online: boolean;         // visible on the customer app/site
  onlinePrice?: number;    // optional online selling price override (else MRP)
  offerId?: string;        // applied offer (online)
  supplierId?: string;     // allotted distributor for reordering
  looseAllowed?: boolean;  // owner's choice: allow per-tablet/loose selling (default on for eligible)
  looseUnits?: number;     // opened loose tablets/capsules currently in stock (from a broken strip)
  emoji?: string;          // legacy field — the UI renders a monogram tile, not an emoji
  image?: string;          // product photo (data URL) — falls back to the monogram tile
  batches: Batch[];
};

export type CategoryKey =
  | "fever" | "cold" | "diabetes" | "heart" | "stomach" | "vitamins"
  | "skin" | "baby" | "devices" | "personal" | "ayush" | "firstaid";

export const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "fever", label: "Fever & Pain" },
  { key: "cold", label: "Cough & Cold" },
  { key: "diabetes", label: "Diabetes" },
  { key: "heart", label: "Heart & BP" },
  { key: "stomach", label: "Stomach" },
  { key: "vitamins", label: "Vitamins" },
  { key: "skin", label: "Skin Care" },
  { key: "baby", label: "Baby Care" },
  { key: "devices", label: "Devices" },
  { key: "personal", label: "Personal" },
  { key: "ayush", label: "Ayurveda" },
  { key: "firstaid", label: "First Aid" },
];
export const catLabel = (key: string) => CATEGORIES.find((c) => c.key === key)?.label ?? key;

export const stockOf = (p: InvProduct) => p.batches.reduce((a, b) => a + b.qty, 0);

// ── rack / bin locations ────────────────────────────────────────
// A medicine's location code (e.g. "A3-12" = Rack A, shelf 3, bin 12) maps the
// physical shelving so a pharmacist reads the code on screen and walks to the spot.
// The code is tied to the MEDICINE, not the batch — new stock of the same item
// always returns to the same bin, so the code never changes on a restock.
export const hasLocation = (p: InvProduct) => !!(p.rack && p.rack.trim());
export const locationCodes = (p: InvProduct): string[] =>
  [p.rack, p.rackAlt].map((x) => (x || "").trim()).filter((x) => !!x);
// the "zone" = the leading rack/almirah token (letters or a prefix before a separator),
// used to group & sort locations together (A1, A2, A3 sit under zone "A")
export const rackZone = (code: string) => {
  const trimmed = (code || "").trim();
  // "A3-12" groups under "A". A code with no letters uses the token before - _ / .
  const leadingLetters = trimmed.match(/^[A-Za-z]+/);
  const leadingToken = leadingLetters ?? trimmed.match(/^[^\s\-_/.]+/);
  return (leadingToken ? leadingToken[0] : trimmed).toUpperCase();
};
// compose Rack + Shelf + Bin into a single code, e.g. ("A","3","12") → "A3-12"
export const composeRack = (rack: string, shelf: string, bin: string) => {
  const r = (rack || "").trim().toUpperCase();
  const s = (shelf || "").trim();
  const b = (bin || "").trim();
  if (!r) return "";
  return `${r}${s}${b ? "-" + b : ""}`;
};
export const normalizeRack = (code: string) => (code || "").trim().toUpperCase();
// location codes already written on medicines
export const distinctRacks = (inv: InvProduct[]): string[] =>
  [...new Set(inv.map((p) => normalizeRack(p.rack)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
export type RackGroup = { code: string; zone: string; items: InvProduct[] };
// group inventory by primary location code, sorted naturally (A1 < A2 < A10 < B1).
// `registry` codes are always included even when no medicine sits there yet (manually-created empty racks).
export const groupByLocation = (inventory: InvProduct[], registry: string[] = []): RackGroup[] => {
  const medicinesByCode = new Map<string, InvProduct[]>();
  for (const savedCode of registry) {
    const code = normalizeRack(savedCode);
    if (code && !medicinesByCode.has(code)) medicinesByCode.set(code, []);
  }
  for (const product of inventory) {
    const code = normalizeRack(product.rack);
    if (!code) continue;
    const medicines = medicinesByCode.get(code) ?? [];
    medicines.push(product);
    medicinesByCode.set(code, medicines);
  }
  return [...medicinesByCode.entries()]
    .map(([code, items]) => ({ code, zone: rackZone(code), items }))
    .sort((left, right) => left.code.localeCompare(right.code, undefined, { numeric: true, sensitivity: "base" }));
};
// does a search term match this product's location code(s)? (rack → medicine lookups)
export const matchesLocation = (p: InvProduct, term: string) => {
  const t = term.trim().toLowerCase();
  if (!t) return false;
  return locationCodes(p).some((c) => c.toLowerCase().includes(t));
};

// ── barcode / batch scanning ────────────────────────────────────
// One code per product, derived from the id so every batch prints the same label.
export const productBarcode = (p: { id: string }): string => "NM" + p.id;
/** Same digits every time for this product and batch. The "890" prefix only looks like a GS1 code. */
export const batchBarcode = (product: InvProduct, batch: Batch): string => {
  const text = product.id + "|" + batch.batchNo;
  let hash = 5381;
  for (let index = 0; index < text.length; index++) {
    hash = ((hash * 33) ^ text.charCodeAt(index)) >>> 0;
  }
  return "890" + String(hash).padStart(10, "0").slice(-10);
};
export type ScanHit = { product: InvProduct; batch?: Batch };
const lettersAndDigits = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
// Match order: product label, then this batch's code, then the printed batch number, then the name.
export const findScan = (inventory: InvProduct[], raw: string): ScanHit | null => {
  const typed = (raw || "").trim();
  if (!typed) return null;
  const folded = lettersAndDigits(typed);

  const byProductLabel = inventory.find((product) => lettersAndDigits(productBarcode(product)) === folded);
  if (byProductLabel) return { product: byProductLabel };

  for (const product of inventory) {
    for (const batch of product.batches) {
      if (batchBarcode(product, batch) === typed) return { product, batch };
    }
  }
  for (const product of inventory) {
    for (const batch of product.batches) {
      if (batch.batchNo && lettersAndDigits(batch.batchNo) === folded) return { product, batch };
    }
  }

  const byIdOrExactName = inventory.find((product) =>
    lettersAndDigits(product.id) === folded || lettersAndDigits(product.name) === folded);
  const byNamePart = byIdOrExactName ?? inventory.find((product) =>
    folded.length >= 3 && lettersAndDigits(product.name).includes(folded));
  return byNamePart ? { product: byNamePart } : null;
};

export const sellPrice = (p: InvProduct) => p.onlinePrice ?? (p.batches[0]?.mrp ?? 0);
export const mrpOf = (p: InvProduct) => p.batches[0]?.mrp ?? 0;

// ── loose / per-tablet selling (offline counter) ────────────────
const round2 = (n: number) => Math.round(n * 100) / 100;
/** Tablets or capsules per pack, parsed from the pack label (e.g. "Strip of 15" → 15). */
export const unitsPerPack = (p: InvProduct): number => {
  if (p.form !== "Tablet" && p.form !== "Capsule") return 1;
  const m = p.pack.match(/(\d+)/);
  return m ? Math.max(1, parseInt(m[1], 10)) : 1;
};
/** Physically splittable into individual tablets/capsules (form + multi-unit pack). */
export const isLooseEligible = (p: InvProduct) => (p.form === "Tablet" || p.form === "Capsule") && unitsPerPack(p) > 1;
/** Sold loose = eligible AND the owner has enabled it (defaults on for eligible items). */
export const looseSellable = (p: InvProduct) => isLooseEligible(p) && (p.looseAllowed ?? true);
export const unitNoun = (p: InvProduct) => (p.form === "Capsule" ? "capsule" : "tablet");

// ── strip + loose-unit stock display ────────────────────────────
/** The selling-unit noun for a product's full pack — strip / bottle / tube / jar / vial / box. */
export const packNoun = (p: InvProduct): string => {
  const pk = (p.pack || "").toLowerCase();
  if (/\btube\b/.test(pk)) return "tube";
  if (/\bbottle\b/.test(pk)) return "bottle";
  if (/\bjar\b/.test(pk)) return "jar";
  if (/\bsachet\b/.test(pk)) return "sachet";
  if (/\bvial\b|\bampoule\b/.test(pk)) return "vial";
  if (/\bbox\b/.test(pk)) return "box";
  if (/\bstrip\b/.test(pk)) return "strip";
  switch (p.form) {
    case "Tablet":
    case "Capsule": return "strip";
    case "Syrup": return "bottle";
    case "Drops": return "bottle";
    case "Cream": return "tube";
    case "Injection": return "vial";
    case "Device": return "unit";
    default: return "pack";
  }
};
/** Pluralise a pack/unit noun (box → boxes, strip → strips). */
export const plural = (noun: string, n: number) => (n === 1 ? noun : noun.endsWith("x") ? noun + "es" : noun + "s");
export const looseUnitsOf = (p: InvProduct) => p.looseUnits ?? 0;
/** Total sellable tablets = full strips × units + opened loose units. */
export const totalUnits = (p: InvProduct) => stockOf(p) * unitsPerPack(p) + looseUnitsOf(p);
/** Human stock label: "155 strips + 11 tablets", "9 bottles", "40 tubes". */
export const stockLabel = (p: InvProduct) => {
  const packs = stockOf(p), loose = looseUnitsOf(p);
  if (looseSellable(p) || loose > 0) {
    const base = `${packs} ${plural(packNoun(p), packs)}`;
    return loose > 0 ? `${base} + ${loose} ${plural(unitNoun(p), loose)}` : base;
  }
  return `${packs} ${plural(packNoun(p), packs)}`;
};

export const isLowStock = (p: InvProduct) => stockOf(p) <= p.reorderLevel;

/** Earliest-expiring batch (FEFO — first-expiry-first-out). */
export const earliestBatch = (p: InvProduct): Batch | null => {
  const withStock = p.batches.filter((b) => b.qty > 0);
  if (!withStock.length) return p.batches[0] ?? null;
  return [...withStock].sort((a, b) => a.expiry.localeCompare(b.expiry))[0];
};

/** Pack or loose price for the batch that will actually be sold. */
export function billUnit(product: InvProduct, opts?: { loose?: boolean; batchNo?: string }): { price: number; mrp: number } {
  const namedBatch = opts?.batchNo
    ? product.batches.find((batch) => batch.batchNo === opts.batchNo)
    : undefined;
  const batch = namedBatch ?? earliestBatch(product);
  const packPrice = product.onlinePrice ?? batch?.mrp ?? 0;
  const packMrp = batch?.mrp ?? 0;
  if (!opts?.loose) return { price: packPrice, mrp: packMrp };
  const tabletsInPack = Math.max(1, unitsPerPack(product));
  return { price: round2(packPrice / tabletsInPack), mrp: round2(packMrp / tabletsInPack) };
}
export const perUnitPrice = (p: InvProduct) => billUnit(p, { loose: true }).price;
export const perUnitMrp = (p: InvProduct) => billUnit(p, { loose: true }).mrp;

/** Months until a "YYYY-MM" expiry relative to a stamped now (ms). */
export const monthsToExpiry = (expiry: string, now: number) => {
  const d = new Date(now);
  const [y, m] = expiry.split("-").map(Number);
  return (y - d.getFullYear()) * 12 + (m - (d.getMonth() + 1));
};
export const isExpiringSoon = (p: InvProduct, now: number, withinMonths = 4) => {
  const b = earliestBatch(p);
  if (!b) return false;
  const mo = monthsToExpiry(b.expiry, now);
  return mo <= withinMonths; // includes already-expired (negative)
};
export const isExpired = (expiry: string, now: number) => monthsToExpiry(expiry, now) < 0;

export const stockValue = (p: InvProduct) => p.batches.reduce((a, b) => a + b.qty * b.ptr, 0);

// is this product a medical device (vs a medicine)?
export const isDevice = (p: InvProduct): boolean => p.form === "Device" || p.category === "devices";
