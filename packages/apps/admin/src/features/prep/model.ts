export type PrepSummary = {
  id: string;
  name: string;
  lineCount: number;
  updatedAt: string;
};

export type PrepLine = {
  position: number;
  productId: string;
  productName: string;
  batchNo: string | null;
  expiry: string | null;
  qty: number | null;
  free: number | null;
  rate: number | null;
  mrp: number | null;
  gst: number | null;
};

export type PrepDetail = {
  id: string;
  name: string;
  updatedAt: string;
  lines: PrepLine[];
};

export type PrepListResponse = { lists: PrepSummary[] };
export type PrepCreatedResponse = { list: PrepSummary };
export type PrepOneResponse = { list: PrepDetail };

export type LineBody = {
  productId: string;
  productName: string;
  batchNo: string | null;
  expiry: string | null;
  qty: number | null;
  free: number | null;
  rate: number | null;
  mrp: number | null;
  gst: number | null;
};

export type CatalogHit = {
  kind: "drug" | "fmcg";
  productId: string;
  productName: string;
  marketerName: string | null;
  mrp: number | null;
};

type Summary = {
  productId: string;
  productName: string;
  marketerName: string | null;
  mrp: number | null;
};

export type SearchResponse = {
  drug: Summary[];
  fmcg: Summary[];
};

export function hitsOf(response: SearchResponse | undefined): CatalogHit[] {
  if (!response) return [];
  return [
    ...response.drug.map((row) => ({ kind: "drug" as const, ...row })),
    ...response.fmcg.map((row) => ({ kind: "fmcg" as const, ...row })),
  ];
}

export function fileName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return `${slug || "inventory"}.csv`;
}
