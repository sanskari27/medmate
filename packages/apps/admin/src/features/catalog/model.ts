export type CatalogKind = "drug" | "fmcg";

export type CatalogFilters = {
  kind: "" | CatalogKind;
  q: string;
  displayName: "" | "missing" | "present";
  prescription: "" | "yes" | "no";
  form: string;
  medicineType: string;
  fmcgType: string;
  marketer: string;
};

export const emptyFilters: CatalogFilters = {
  kind: "",
  q: "",
  displayName: "",
  prescription: "",
  form: "",
  medicineType: "",
  fmcgType: "",
  marketer: "",
};

export type DrugSummary = {
  productId: string;
  productName: string;
  displayName: string | null;
  marketerName: string | null;
};

export type FmcgSummary = {
  productId: string;
  productName: string;
  displayName: string | null;
  marketerName: string | null;
};

export type SummaryPage<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
};

export type CatalogList = {
  drug: SummaryPage<DrugSummary>;
  fmcg: SummaryPage<FmcgSummary>;
};

export type CatalogProduct = Record<string, unknown> & {
  productId?: string;
  productName?: string | null;
  displayName?: string | null;
  prescriptionRequired?: boolean;
};

export type ProductsResponse = {
  drug: CatalogProduct[];
  fmcg: CatalogProduct[];
};

type Column = { key: string; label: string; required?: boolean; numeric?: boolean };

type TextList = { key: string; label: string; shape: "text" };

type ObjectList = { key: string; label: string; shape: "object"; columns: Column[] };

export type ChildList = TextList | ObjectList;

export type ParentField = {
  key: string;
  label: string;
  required?: boolean;
  numeric?: boolean;
  multiline?: boolean;
};

const drugParent: ParentField[] = [
  { key: "productId", label: "Product id", required: true },
  { key: "displayName", label: "Display name" },
  { key: "productName", label: "Product name", required: true },
  { key: "marketerName", label: "Marketer" },
  { key: "marketerAddress", label: "Marketer address", multiline: true },
  { key: "medicineType", label: "Medicine type" },
  { key: "introduction", label: "Introduction", multiline: true },
  { key: "benefits", label: "Benefits", multiline: true },
  { key: "howToUse", label: "How to use", multiline: true },
  { key: "ifMiss", label: "If a dose is missed", multiline: true },
  { key: "packagingDetail", label: "Packaging detail", multiline: true },
  { key: "package", label: "Package" },
  { key: "qtyAmount", label: "Quantity", numeric: true },
  { key: "qtyUnit", label: "Quantity unit" },
  { key: "qtyRaw", label: "Quantity text" },
  { key: "productForm", label: "Product form" },
  { key: "mrp", label: "MRP", numeric: true },
  { key: "storage", label: "Storage" },
  { key: "howItWorks", label: "How it works", multiline: true },
  { key: "countryOfOrigin", label: "Country of origin" },
  { key: "sourceFile", label: "Source file" },
];

const fmcgParent: ParentField[] = [
  { key: "productId", label: "Product id", required: true },
  { key: "displayName", label: "Display name" },
  { key: "productName", label: "Product name", required: true },
  { key: "marketingCompany", label: "Marketing company" },
  { key: "type", label: "Type" },
  { key: "packaging", label: "Packaging" },
  { key: "package", label: "Package" },
  { key: "qtyAmount", label: "Quantity", numeric: true },
  { key: "qtyUnit", label: "Quantity unit" },
  { key: "qtyRaw", label: "Quantity text" },
  { key: "productForm", label: "Product form" },
  { key: "mrp", label: "MRP", numeric: true },
  { key: "information", label: "Information", multiline: true },
  { key: "directionsForUse", label: "Directions for use", multiline: true },
  { key: "countryOfOrigin", label: "Country of origin" },
  { key: "marketerName", label: "Marketer" },
  { key: "marketerAddress", label: "Marketer address", multiline: true },
  { key: "sourceFile", label: "Source file" },
];

const drugChildren: ChildList[] = [
  {
    key: "ingredients",
    label: "Ingredients",
    shape: "object",
    columns: [
      { key: "name", label: "Name", required: true },
      { key: "strength", label: "Strength" },
      { key: "amount", label: "Amount", numeric: true },
      { key: "unit", label: "Unit" },
    ],
  },
  {
    key: "safety",
    label: "Safety",
    shape: "object",
    columns: [
      { key: "topic", label: "Topic", required: true },
      { key: "level", label: "Level" },
      { key: "detail", label: "Detail" },
    ],
  },
  {
    key: "facts",
    label: "Facts",
    shape: "object",
    columns: [
      { key: "label", label: "Label", required: true },
      { key: "value", label: "Value" },
    ],
  },
  { key: "uses", label: "Uses", shape: "text" },
  { key: "sideEffects", label: "Side effects", shape: "text" },
  {
    key: "questions",
    label: "Questions",
    shape: "object",
    columns: [
      { key: "question", label: "Question", required: true },
      { key: "answer", label: "Answer" },
    ],
  },
  {
    key: "interactions",
    label: "Interactions",
    shape: "object",
    columns: [
      { key: "drug", label: "Drug" },
      { key: "route", label: "Route" },
      { key: "severity", label: "Severity" },
      { key: "otherProduct", label: "Other product" },
      { key: "interactsWith", label: "Interacts with" },
      { key: "detail", label: "Detail" },
    ],
  },
  { key: "images", label: "Images", shape: "text" },
];

const fmcgChildren: ChildList[] = [
  { key: "categories", label: "Categories", shape: "text" },
  { key: "highlights", label: "Highlights", shape: "text" },
  { key: "ingredients", label: "Ingredients", shape: "text" },
  { key: "benefits", label: "Benefits", shape: "text" },
  { key: "safety", label: "Safety", shape: "text" },
  { key: "images", label: "Images", shape: "text" },
];

export function parentFields(kind: CatalogKind): ParentField[] {
  return kind === "drug" ? drugParent : fmcgParent;
}

export function childLists(kind: CatalogKind): ChildList[] {
  return kind === "drug" ? drugChildren : fmcgChildren;
}

export type Draft = {
  fields: Record<string, string>;
  prescriptionRequired: boolean;
  texts: Record<string, string[]>;
  objects: Record<string, Record<string, string>[]>;
};

export function emptyDraft(kind: CatalogKind): Draft {
  const fields: Record<string, string> = {};
  for (const field of parentFields(kind)) fields[field.key] = "";
  const texts: Record<string, string[]> = {};
  const objects: Record<string, Record<string, string>[]> = {};
  for (const list of childLists(kind)) {
    if (list.shape === "text") texts[list.key] = [];
    else objects[list.key] = [];
  }
  return { fields, prescriptionRequired: false, texts, objects };
}

function textOf(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

export function draftFrom(kind: CatalogKind, product: CatalogProduct): Draft {
  const draft = emptyDraft(kind);
  for (const field of parentFields(kind)) {
    draft.fields[field.key] = textOf(product[field.key]);
  }
  draft.prescriptionRequired = product.prescriptionRequired === true;
  for (const list of childLists(kind)) {
    const value = product[list.key];
    if (!Array.isArray(value)) continue;
    if (list.shape === "text") {
      draft.texts[list.key] = value.map((item) => textOf(item));
    } else {
      draft.objects[list.key] = value.map((item) => {
        const row: Record<string, string> = {};
        const record = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
        for (const column of list.columns) row[column.key] = textOf(record[column.key]);
        return row;
      });
    }
  }
  return draft;
}

function parseNumber(raw: string): number | undefined | "invalid" {
  const text = raw.trim();
  if (!text) return undefined;
  const value = Number(text);
  if (!Number.isFinite(value)) return "invalid";
  return value;
}

export function productBody(
  kind: CatalogKind,
  draft: Draft,
): { body?: Record<string, unknown>; error?: string } {
  const productId = draft.fields.productId?.trim() ?? "";
  const productName = draft.fields.productName?.trim() ?? "";
  if (productId.length < 1 || productId.length > 80 || productName.length === 0) {
    return { error: "Product is not valid" };
  }
  const body: Record<string, unknown> = { productId, productName };
  if (kind === "drug") body.prescriptionRequired = draft.prescriptionRequired;
  const displayName = draft.fields.displayName?.trim() ?? "";
  if (displayName) body.displayName = displayName;
  for (const field of parentFields(kind)) {
    if (field.key === "productId" || field.key === "productName" || field.key === "displayName") {
      continue;
    }
    const raw = draft.fields[field.key] ?? "";
    if (field.numeric) {
      const parsed = parseNumber(raw);
      if (parsed === "invalid") return { error: "Product is not valid" };
      if (parsed !== undefined) body[field.key] = parsed;
    } else {
      const text = raw.trim();
      if (text) body[field.key] = text;
    }
  }
  for (const list of childLists(kind)) {
    if (list.shape === "text") {
      const values = draft.texts[list.key] ?? [];
      if (values.length > 200) return { error: "Product is not valid" };
      const texts: string[] = [];
      for (const value of values) {
        const text = value.trim();
        if (!text) return { error: "Product is not valid" };
        texts.push(text);
      }
      body[list.key] = texts;
      continue;
    }
    const rows = draft.objects[list.key] ?? [];
    if (rows.length > 200) return { error: "Product is not valid" };
    const objects: Record<string, unknown>[] = [];
    for (const row of rows) {
      const item: Record<string, unknown> = {};
      for (const column of list.columns) {
        const raw = row[column.key] ?? "";
        if (column.numeric) {
          const parsed = parseNumber(raw);
          if (parsed === "invalid") return { error: "Product is not valid" };
          if (column.required && parsed === undefined) return { error: "Product is not valid" };
          if (parsed !== undefined) item[column.key] = parsed;
        } else {
          const text = raw.trim();
          if (column.required && !text) return { error: "Product is not valid" };
          if (text) item[column.key] = text;
        }
      }
      objects.push(item);
    }
    body[list.key] = objects;
  }
  return { body };
}

export function rowMeta(productId: string, marketerName: string | null): string {
  return marketerName ? `${productId} · ${marketerName}` : productId;
}
