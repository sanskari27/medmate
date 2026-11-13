import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { DRUG_SEARCH_SQL, FMCG_SEARCH_SQL, PgCatalog } from "../src/catalog.js";
import { isAllowedOrigin } from "../src/cors.js";
import { handleHttp } from "../src/http.js";
import { mapDrugDetail, mapDrugSummary, mapFmcgSummary } from "../src/map.js";
import { containsPattern } from "../src/query.js";
import type { Catalog, Db, DrugDetail, DrugSummary, FmcgDetail, FmcgSummary } from "../src/types.js";

const summaryDrug: DrugSummary = {
  productId: "DR1",
  productName: "Crocin Advance",
  marketerName: "GSK",
  medicineType: "allopathy",
  productForm: "Tablet",
  mrp: 25,
  prescriptionRequired: false,
  package: "Strip",
  qtyAmount: 15,
  qtyUnit: "tablets",
};

const summaryFmcg: FmcgSummary = {
  productId: "DR2",
  productName: "Protein Powder",
  marketerName: "Merhaki",
  marketingCompany: "Merhaki Foods",
  type: "Supplement",
  productForm: "Powder",
  mrp: 1499,
  package: "Bottle",
  qtyAmount: 500,
  qtyUnit: "gm",
};

const detailDrug: DrugDetail = {
  ...summaryDrug,
  marketerAddress: "Mumbai",
  introduction: "Used for fever",
  benefits: "Reduces fever",
  howToUse: "After food",
  ifMiss: "Skip the dose",
  packagingDetail: "Strip of 15",
  qtyRaw: "15 tablets",
  storage: "Cool place",
  howItWorks: "Blocks pain signals",
  countryOfOrigin: "India",
  sourceFile: "drug.xlsx",
  ingredients: [{ name: "Paracetamol", strength: "500 mg", amount: 500, unit: "mg" }],
  safety: [{ topic: "Alcohol", level: "caution", detail: "Avoid" }],
  facts: [{ label: "Habit forming", value: "No" }],
  uses: ["Fever"],
  sideEffects: ["Nausea"],
  questions: [{ question: "Is it safe?", answer: "Yes" }],
  interactions: [
    {
      drug: "Warfarin",
      route: "oral",
      severity: "moderate",
      otherProduct: null,
      interactsWith: "Warfarin",
      detail: "Monitor",
    },
  ],
  images: ["https://example.com/crocin.jpg"],
};

const detailFmcg: FmcgDetail = {
  productId: "DR2",
  productName: "Protein Powder",
  marketingCompany: "Merhaki Foods",
  type: "Supplement",
  packaging: "Bottle of 500 gm",
  package: "Bottle",
  qtyAmount: 500,
  qtyUnit: "gm",
  qtyRaw: "500 gm",
  productForm: "Powder",
  mrp: 1499,
  information: "Daily protein",
  directionsForUse: "Mix with water",
  countryOfOrigin: "India",
  marketerName: "Merhaki",
  marketerAddress: "Bengaluru",
  sourceFile: "otc-fmcg.xlsx",
  categories: ["Vitamins"],
  highlights: ["30 g protein"],
  ingredients: ["Pea protein"],
  benefits: ["Energy"],
  safety: ["Store cool"],
  images: ["https://example.com/protein.jpg"],
};

function catalog(calls: { query?: string; limit?: number; id?: string }[]): Catalog {
  return {
    async searchDrugs(query, limit) {
      calls.push({ query, limit });
      return [summaryDrug];
    },
    async searchFmcg(query, limit) {
      calls.push({ query, limit });
      return [summaryFmcg];
    },
    async findDrug(id) {
      calls.push({ id });
      if (id === "missing" || id === "fmcg-only") return null;
      return detailDrug;
    },
    async findFmcg(id) {
      calls.push({ id });
      if (id === "missing" || id === "DR1") return null;
      return detailFmcg;
    },
  };
}

describe("cors", () => {
  it("allows the two zones, their subdomains, and localhost", () => {
    assert.equal(isAllowedOrigin("https://nammamedmate.com"), true);
    assert.equal(isAllowedOrigin("https://dispensary.nammamedmate.com"), true);
    assert.equal(isAllowedOrigin("https://medmatepharmacy.com"), true);
    assert.equal(isAllowedOrigin("https://api.nammamedmate.com"), true);
    assert.equal(isAllowedOrigin("http://localhost:3204"), true);
    assert.equal(isAllowedOrigin("https://localhost"), false);
    assert.equal(isAllowedOrigin("https://evil.example"), false);
    assert.equal(isAllowedOrigin("http://dispensary.nammamedmate.com"), false);
  });

  it("rejects a disallowed origin before reading data", async () => {
    const calls: { id?: string }[] = [];
    const result = await handleHttp(
      { method: "GET", url: "/api/products/DR1", origin: "https://evil.example" },
      catalog(calls),
    );
    assert.equal(result.status, 403);
    assert.deepEqual(result.body, { error: { code: "FORBIDDEN", message: "Origin is not allowed" } });
    assert.equal(calls.length, 0);
  });

  it("echoes an allowed origin", async () => {
    const result = await handleHttp(
      { method: "GET", url: "/health", origin: "https://dispensary.nammamedmate.com" },
      catalog([]),
    );
    assert.equal(result.status, 200);
    assert.equal(result.headers["access-control-allow-origin"], "https://dispensary.nammamedmate.com");
    assert.equal(result.headers["access-control-allow-methods"], "GET, OPTIONS");
  });
});

describe("search", () => {
  it("groups summary rows and caps the limit at 50", async () => {
    const calls: { query?: string; limit?: number }[] = [];
    const result = await handleHttp({ method: "GET", url: "/api/search?q=crocin&limit=80" }, catalog(calls));
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { drug: [summaryDrug], fmcg: [summaryFmcg] });
    assert.equal("introduction" in summaryDrug, false);
    assert.equal("ingredients" in summaryDrug, false);
    assert.deepEqual(calls, [
      { query: "crocin", limit: 50 },
      { query: "crocin", limit: 50 },
    ]);
  });

  it("returns an empty group when nothing matches", async () => {
    const empty: Catalog = {
      async searchDrugs() {
        return [];
      },
      async searchFmcg() {
        return [];
      },
      async findDrug() {
        return null;
      },
      async findFmcg() {
        return null;
      },
    };
    const result = await handleHttp({ method: "GET", url: "/api/search?q=zzzzqqqq" }, empty);
    assert.equal(result.status, 200);
    assert.deepEqual(result.body, { drug: [], fmcg: [] });
  });

  it("rejects a short query", async () => {
    const result = await handleHttp({ method: "GET", url: "/api/search?q=a" }, catalog([]));
    assert.equal(result.status, 400);
    assert.deepEqual(result.body, { error: { code: "BAD_REQUEST", message: "q must be 2 to 80 characters" } });
  });
});

describe("find many ids", () => {
  it("returns found rows and the ids that are in neither catalog", async () => {
    const calls: { id?: string }[] = [];
    const result = await handleHttp(
      { method: "GET", url: "/api/products?ids=DR1,missing,fmcg-only,DR1" },
      catalog(calls),
    );
    assert.equal(result.status, 200);
    const body = result.body as { drug: DrugDetail[]; fmcg: FmcgDetail[]; missing: string[] };
    assert.deepEqual(
      body.drug.map((row) => row.productId),
      ["DR1"],
    );
    assert.deepEqual(
      body.fmcg.map((row) => row.productId),
      ["DR2"],
    );
    assert.deepEqual(body.missing, ["missing"]);
    assert.deepEqual(
      calls.map((call) => call.id),
      ["DR1", "DR1", "missing", "missing", "fmcg-only", "fmcg-only"],
    );
  });

  it("rejects an empty id list and a list past 200", async () => {
    const empty = await handleHttp({ method: "GET", url: "/api/products?ids=" }, catalog([]));
    assert.equal(empty.status, 400);
    assert.deepEqual(empty.body, {
      error: { code: "BAD_REQUEST", message: "ids must contain 1 to 200 product ids" },
    });
    const tooMany = await handleHttp(
      { method: "GET", url: `/api/products?ids=${Array.from({ length: 201 }, (_, index) => `DR${index}`).join(",")}` },
      catalog([]),
    );
    assert.equal(tooMany.status, 400);
  });
});

describe("find by id", () => {
  it("returns the full drug record and an empty fmcg list", async () => {
    const result = await handleHttp({ method: "GET", url: "/api/products/DR1" }, catalog([]));
    assert.equal(result.status, 200);
    const body = result.body as { drug: DrugDetail[]; fmcg: FmcgDetail[] };
    assert.equal(body.drug.length, 1);
    assert.deepEqual(body.fmcg, []);
    assert.equal(body.drug[0].introduction, "Used for fever");
    assert.deepEqual(body.drug[0].ingredients, detailDrug.ingredients);
    assert.deepEqual(body.drug[0].images, detailDrug.images);
  });

  it("returns 404 with both lists empty when the id is missing", async () => {
    const result = await handleHttp({ method: "GET", url: "/api/products/missing" }, catalog([]));
    assert.equal(result.status, 404);
    assert.deepEqual(result.body, { drug: [], fmcg: [] });
  });
});

describe("row mapping", () => {
  it("keeps search rows to summary fields and parses numbers", () => {
    const mapped = mapDrugSummary({
      product_id: "DR1",
      product_name: "Crocin",
      marketer_name: "GSK",
      medicine_type: "allopathy",
      product_form: "Tablet",
      mrp: "25.50",
      prescription_required: true,
      package: "Strip",
      qty_amount: "15",
      qty_unit: "tablets",
      introduction: "hidden",
    });
    assert.equal(mapped.mrp, 25.5);
    assert.equal(mapped.qtyAmount, 15);
    assert.equal("introduction" in mapped, false);
    const fmcg = mapFmcgSummary({
      product_id: "DR2",
      product_name: "Powder",
      marketing_company: "Merhaki",
      mrp: "10.00",
      information: "hidden",
    });
    assert.equal(fmcg.mrp, 10);
    assert.equal(fmcg.marketingCompany, "Merhaki");
    assert.equal("information" in fmcg, false);
  });

  it("maps every child list on a full drug", () => {
    const detail = mapDrugDetail(
      {
        product_id: "DR1",
        product_name: "Crocin",
        prescription_required: false,
        mrp: "12.00",
        introduction: "Fever",
      },
      {
        ingredients: [{ name: "Paracetamol", strength: "500 mg", amount: "500", unit: "mg" }],
        safety: [{ topic: "Alcohol", level: "caution", detail: "Avoid" }],
        facts: [{ label: "Habit forming", value: "No" }],
        uses: [{ use_text: "Fever" }],
        sideEffects: [{ effect: "Nausea" }],
        questions: [{ question: "Safe?", answer: "Yes" }],
        interactions: [{ drug: "Warfarin", route: null, severity: "moderate", other_product: null, interacts_with: "Warfarin", detail: "Monitor" }],
        images: [{ url: "https://example.com/crocin.jpg" }],
      },
    );
    assert.equal(detail.introduction, "Fever");
    assert.equal(detail.ingredients[0].amount, 500);
    assert.deepEqual(detail.uses, ["Fever"]);
    assert.deepEqual(detail.sideEffects, ["Nausea"]);
    assert.equal(detail.interactions[0].otherProduct, null);
  });
});

describe("database queries", () => {
  it("matches product id exactly and contains-searches the other fields", async () => {
    assert.match(DRUG_SEARCH_SQL, /product_id = \$1/);
    assert.doesNotMatch(DRUG_SEARCH_SQL, /product_id ILIKE/);
    assert.match(DRUG_SEARCH_SQL, /product_name ILIKE/);
    assert.match(FMCG_SEARCH_SQL, /marketing_company ILIKE/);
    assert.equal(containsPattern("100%_a"), "%100\\%\\_a%");

    const calls: { sql: string; params?: unknown[] }[] = [];
    const db: Db = {
      async query(sql, params) {
        calls.push({ sql, params });
        if (sql.includes("FROM drugs") && sql.includes("introduction")) {
          return {
            rows: [
              {
                product_id: "DR1",
                product_name: "Crocin",
                prescription_required: true,
                introduction: "Fever",
              },
            ],
          };
        }
        if (sql.includes("FROM drugs")) {
          return {
            rows: [
              {
                product_id: "DR1",
                product_name: "Crocin",
                marketer_name: "GSK",
                medicine_type: "allopathy",
                product_form: "Tablet",
                mrp: "25.00",
                prescription_required: false,
                package: "Strip",
                qty_amount: "15",
                qty_unit: "tablets",
              },
            ],
          };
        }
        if (sql.includes("FROM otc_fmcg") && sql.includes("information")) {
          return { rows: [] };
        }
        if (sql.includes("FROM otc_fmcg")) {
          return { rows: [] };
        }
        if (sql.includes("drug_ingredients")) {
          return { rows: [{ name: "Paracetamol", strength: "500 mg", amount: "500", unit: "mg" }] };
        }
        return { rows: [] };
      },
    };
    const pg = new PgCatalog(db);
    const found = await pg.searchDrugs("crocin", 20);
    assert.equal(found.length, 1);
    assert.equal(found[0].productName, "Crocin");
    assert.equal("introduction" in found[0], false);
    assert.deepEqual(calls[0].params, ["crocin", "%crocin%", 20]);

    const full = await pg.findDrug("DR1");
    assert.equal(full?.introduction, "Fever");
    assert.equal(full?.ingredients[0].name, "Paracetamol");
    assert.equal(full?.images.length, 0);
    const missing = await pg.findFmcg("DR1");
    assert.equal(missing, null);
  });
});

describe("schema files", () => {
  it("creates the trigram indexes used by search", async () => {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../schema");
    const drug = await readFile(path.join(root, "drug-master-schema.sql"), "utf8");
    const fmcg = await readFile(path.join(root, "otc-fmcg-master-schema.sql"), "utf8");
    for (const name of [
      "drugs_product_name_trgm",
      "drugs_marketer_name_trgm",
      "drugs_medicine_type_trgm",
      "drugs_product_form_trgm",
    ]) {
      assert.match(drug, new RegExp(name));
    }
    for (const name of [
      "otc_fmcg_product_name_trgm",
      "otc_fmcg_marketer_name_trgm",
      "otc_fmcg_marketing_company_trgm",
      "otc_fmcg_type_trgm",
      "otc_fmcg_product_form_trgm",
    ]) {
      assert.match(fmcg, new RegExp(name));
    }
    assert.match(drug, /PRIMARY KEY/);
    assert.match(fmcg, /CREATE TABLE IF NOT EXISTS otc_fmcg/);
  });
});
