export type DrugSummary = {
  productId: string;
  productName: string;
  marketerName: string | null;
  medicineType: string | null;
  productForm: string | null;
  mrp: number | null;
  prescriptionRequired: boolean;
  package: string | null;
  qtyAmount: number | null;
  qtyUnit: string | null;
};

export type FmcgSummary = {
  productId: string;
  productName: string | null;
  marketerName: string | null;
  marketingCompany: string | null;
  type: string | null;
  productForm: string | null;
  mrp: number | null;
  package: string | null;
  qtyAmount: number | null;
  qtyUnit: string | null;
};

export type DrugIngredient = {
  name: string;
  strength: string | null;
  amount: number | null;
  unit: string | null;
};

export type DrugSafety = {
  topic: string;
  level: string | null;
  detail: string | null;
};

export type DrugFact = {
  label: string;
  value: string | null;
};

export type DrugQuestion = {
  question: string;
  answer: string | null;
};

export type DrugInteraction = {
  drug: string | null;
  route: string | null;
  severity: string | null;
  otherProduct: string | null;
  interactsWith: string | null;
  detail: string | null;
};

export type DrugDetail = {
  productId: string;
  productName: string;
  marketerName: string | null;
  marketerAddress: string | null;
  medicineType: string | null;
  introduction: string | null;
  benefits: string | null;
  howToUse: string | null;
  ifMiss: string | null;
  packagingDetail: string | null;
  package: string | null;
  qtyAmount: number | null;
  qtyUnit: string | null;
  qtyRaw: string | null;
  productForm: string | null;
  mrp: number | null;
  prescriptionRequired: boolean;
  storage: string | null;
  howItWorks: string | null;
  countryOfOrigin: string | null;
  sourceFile: string | null;
  ingredients: DrugIngredient[];
  safety: DrugSafety[];
  facts: DrugFact[];
  uses: string[];
  sideEffects: string[];
  questions: DrugQuestion[];
  interactions: DrugInteraction[];
  images: string[];
};

export type FmcgDetail = {
  productId: string;
  productName: string | null;
  marketingCompany: string | null;
  type: string | null;
  packaging: string | null;
  package: string | null;
  qtyAmount: number | null;
  qtyUnit: string | null;
  qtyRaw: string | null;
  productForm: string | null;
  mrp: number | null;
  information: string | null;
  directionsForUse: string | null;
  countryOfOrigin: string | null;
  marketerName: string | null;
  marketerAddress: string | null;
  sourceFile: string | null;
  categories: string[];
  highlights: string[];
  ingredients: string[];
  benefits: string[];
  safety: string[];
  images: string[];
};

export type Grouped<TDrug, TFmcg> = {
  drug: TDrug[];
  fmcg: TFmcg[];
};

export type SearchBody = Grouped<DrugSummary, FmcgSummary>;
export type ProductBody = Grouped<DrugDetail, FmcgDetail>;

export type Catalog = {
  searchDrugs(query: string, limit: number): Promise<DrugSummary[]>;
  searchFmcg(query: string, limit: number): Promise<FmcgSummary[]>;
  findDrug(productId: string): Promise<DrugDetail | null>;
  findFmcg(productId: string): Promise<FmcgDetail | null>;
};

export type Db = {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
};
