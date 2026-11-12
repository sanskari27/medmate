import type { DraftLine } from "./model";

export const SAMPLE_CSV = `product_id,batch_no,expiry,qty,free,rate,mrp,gst
DR100,BATCH1,2027-06,10,1,12.50,18.00,12
`;

const COLUMNS = ["product_id", "batch_no", "expiry", "qty", "free", "rate", "mrp", "gst"] as const;
const GST = new Set(["0", "5", "12", "18"]);

const COLUMN_ALIASES: Record<string, (typeof COLUMNS)[number]> = {
  productid: "product_id",
  medicineid: "product_id",
  itemid: "product_id",
  batchno: "batch_no",
  batchnumber: "batch_no",
  batch: "batch_no",
  lot: "batch_no",
  lotno: "batch_no",
  expiry: "expiry",
  expirydate: "expiry",
  exp: "expiry",
  expdate: "expiry",
  qty: "qty",
  quantity: "qty",
  billedqty: "qty",
  free: "free",
  freeqty: "free",
  freequantity: "free",
  freegoods: "free",
  rate: "rate",
  purchaserate: "rate",
  ptr: "rate",
  mrp: "mrp",
  maxretailprice: "mrp",
  gst: "gst",
  gstpercent: "gst",
  gstrate: "gst",
};

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
  const columns = columnIndex(split(rows[headerIndex]).map(normalize));
  const missing = COLUMNS.filter((column) => columns[column] < 0);
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
    const value = (name: (typeof COLUMNS)[number]) => cells[columns[name]]?.trim() ?? "";
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

function columnIndex(header: string[]): Record<(typeof COLUMNS)[number], number> {
  const columns = {
    product_id: -1,
    batch_no: -1,
    expiry: -1,
    qty: -1,
    free: -1,
    rate: -1,
    mrp: -1,
    gst: -1,
  };
  header.forEach((name, index) => {
    const column = COLUMN_ALIASES[name];
    if (column && columns[column] < 0) columns[column] = index;
  });
  return columns;
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function split(row: string): string[] {
  return row.split(",").map((cell) => cell.trim());
}
