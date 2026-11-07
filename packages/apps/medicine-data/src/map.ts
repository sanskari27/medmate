import type {
  DrugDetail,
  DrugSummary,
  FmcgDetail,
  FmcgSummary,
} from "./types.js";

function text(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

function requiredText(value: unknown): string {
  return text(value) ?? "";
}

function number(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function flag(value: unknown): boolean {
  return value === true || value === "true" || value === "t";
}

export function mapDrugSummary(row: Record<string, unknown>): DrugSummary {
  return {
    productId: requiredText(row.product_id),
    productName: requiredText(row.product_name),
    marketerName: text(row.marketer_name),
    medicineType: text(row.medicine_type),
    productForm: text(row.product_form),
    mrp: number(row.mrp),
    prescriptionRequired: flag(row.prescription_required),
    package: text(row.package),
    qtyAmount: number(row.qty_amount),
    qtyUnit: text(row.qty_unit),
  };
}

export function mapFmcgSummary(row: Record<string, unknown>): FmcgSummary {
  return {
    productId: requiredText(row.product_id),
    productName: text(row.product_name),
    marketerName: text(row.marketer_name),
    marketingCompany: text(row.marketing_company),
    type: text(row.type),
    productForm: text(row.product_form),
    mrp: number(row.mrp),
    package: text(row.package),
    qtyAmount: number(row.qty_amount),
    qtyUnit: text(row.qty_unit),
  };
}

export function mapDrugDetail(
  row: Record<string, unknown>,
  children: {
    ingredients: Record<string, unknown>[];
    safety: Record<string, unknown>[];
    facts: Record<string, unknown>[];
    uses: Record<string, unknown>[];
    sideEffects: Record<string, unknown>[];
    questions: Record<string, unknown>[];
    interactions: Record<string, unknown>[];
    images: Record<string, unknown>[];
  },
): DrugDetail {
  return {
    productId: requiredText(row.product_id),
    productName: requiredText(row.product_name),
    marketerName: text(row.marketer_name),
    marketerAddress: text(row.marketer_address),
    medicineType: text(row.medicine_type),
    introduction: text(row.introduction),
    benefits: text(row.benefits),
    howToUse: text(row.how_to_use),
    ifMiss: text(row.if_miss),
    packagingDetail: text(row.packaging_detail),
    package: text(row.package),
    qtyAmount: number(row.qty_amount),
    qtyUnit: text(row.qty_unit),
    qtyRaw: text(row.qty_raw),
    productForm: text(row.product_form),
    mrp: number(row.mrp),
    prescriptionRequired: flag(row.prescription_required),
    storage: text(row.storage),
    howItWorks: text(row.how_it_works),
    countryOfOrigin: text(row.country_of_origin),
    sourceFile: text(row.source_file),
    ingredients: children.ingredients.map((item) => ({
      name: requiredText(item.name),
      strength: text(item.strength),
      amount: number(item.amount),
      unit: text(item.unit),
    })),
    safety: children.safety.map((item) => ({
      topic: requiredText(item.topic),
      level: text(item.level),
      detail: text(item.detail),
    })),
    facts: children.facts.map((item) => ({
      label: requiredText(item.label),
      value: text(item.value),
    })),
    uses: children.uses.map((item) => requiredText(item.use_text)),
    sideEffects: children.sideEffects.map((item) => requiredText(item.effect)),
    questions: children.questions.map((item) => ({
      question: requiredText(item.question),
      answer: text(item.answer),
    })),
    interactions: children.interactions.map((item) => ({
      drug: text(item.drug),
      route: text(item.route),
      severity: text(item.severity),
      otherProduct: text(item.other_product),
      interactsWith: text(item.interacts_with),
      detail: text(item.detail),
    })),
    images: children.images.map((item) => requiredText(item.url)),
  };
}

export function mapFmcgDetail(
  row: Record<string, unknown>,
  children: {
    categories: Record<string, unknown>[];
    highlights: Record<string, unknown>[];
    ingredients: Record<string, unknown>[];
    benefits: Record<string, unknown>[];
    safety: Record<string, unknown>[];
    images: Record<string, unknown>[];
  },
): FmcgDetail {
  return {
    productId: requiredText(row.product_id),
    productName: text(row.product_name),
    marketingCompany: text(row.marketing_company),
    type: text(row.type),
    packaging: text(row.packaging),
    package: text(row.package),
    qtyAmount: number(row.qty_amount),
    qtyUnit: text(row.qty_unit),
    qtyRaw: text(row.qty_raw),
    productForm: text(row.product_form),
    mrp: number(row.mrp),
    information: text(row.information),
    directionsForUse: text(row.directions_for_use),
    countryOfOrigin: text(row.country_of_origin),
    marketerName: text(row.marketer_name),
    marketerAddress: text(row.marketer_address),
    sourceFile: text(row.source_file),
    categories: children.categories.map((item) => requiredText(item.segment)),
    highlights: children.highlights.map((item) => requiredText(item.highlight)),
    ingredients: children.ingredients.map((item) => requiredText(item.ingredient)),
    benefits: children.benefits.map((item) => requiredText(item.benefit)),
    safety: children.safety.map((item) => requiredText(item.safety_text)),
    images: children.images.map((item) => requiredText(item.url)),
  };
}
