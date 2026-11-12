import type { DraftLine } from "./model";

export const SAMPLE_CSV = `product_id,batch_no,expiry,qty,free,rate,mrp,gst
DR100,BATCH1,2027-06,10,1,12.50,18.00,12
`;

const COLUMNS = ["product_id", "batch_no", "expiry", "qty", "free", "rate", "mrp", "gst"] as const;
const GST = new Set(["0", "5", "12", "18"]);

export type CsvLine = {
  line: number;
  productId: string;
  batchNo: string;
  expiry: string;
  qty: number;
  freeQty: number;
  rate: string;
  mrp: string;
  gst: string;
};

export type CsvIssue = { line: number; message: string };

export function parsePurchaseCsv(text: string): { lines: CsvLine[]; issues: CsvIssue[] } {
  const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const headerIndex = rows.findIndex((row) => row.trim().length > 0);
  if (headerIndex < 0)
    return { lines: [], issues: [{ line: 1, message: "The sample columns are required" }] };
  const header = split(rows[headerIndex]).map(normalize);
  const missing = COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return {
      lines: [],
      issues: [{ line: headerIndex + 1, message: "The sample columns are required" }],
    };
  }
  const lines: CsvLine[] = [];
  const issues: CsvIssue[] = [];
  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    if (!rows[index].trim()) continue;
    const cells = split(rows[index]);
    const value = (name: (typeof COLUMNS)[number]) => cells[header.indexOf(name)]?.trim() ?? "";
    const line = index + 1;
    const problem = problemFor(value);
    if (problem) {
      issues.push({ line, message: problem });
      continue;
    }
    lines.push({
      line,
      productId: value("product_id"),
      batchNo: value("batch_no"),
      expiry: value("expiry"),
      qty: Number(value("qty")),
      freeQty: Number(value("free")),
      rate: value("rate"),
      mrp: value("mrp"),
      gst: value("gst"),
    });
  }
  return { lines, issues };
}

export function draftFromCsv(line: CsvLine, name: string): DraftLine {
  return {
    key: `csv-${line.line}-${line.productId}`,
    productId: line.productId,
    name,
    batchNo: line.batchNo,
    expiry: line.expiry,
    qty: String(line.qty),
    freeQty: String(line.freeQty),
    rate: line.rate,
    mrp: line.mrp,
    gst: line.gst,
  };
}

export function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "purchase-sample.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function problemFor(value: (name: (typeof COLUMNS)[number]) => string): string | null {
  if (!value("product_id")) return "Product is required";
  if (!value("batch_no") || value("batch_no").length > 40) return "Batch number is required";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value("expiry"))) return "Expiry is not valid";
  if (!whole(value("qty")) || !whole(value("free"))) return "Quantity must be a whole number";
  if (Number(value("qty")) + Number(value("free")) <= 0) return "Add at least one unit";
  if (!money(value("rate"))) return "Rate is not valid";
  if (!money(value("mrp"))) return "MRP is not valid";
  if (!GST.has(value("gst"))) return "GST percent is not recognised";
  return null;
}

function whole(value: string): boolean {
  return /^\d+$/.test(value);
}

function money(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value);
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function split(row: string): string[] {
  return row.split(",").map((cell) => cell.trim());
}
