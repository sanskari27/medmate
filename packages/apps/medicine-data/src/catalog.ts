import { mapDrugDetail, mapDrugSummary, mapFmcgDetail, mapFmcgSummary } from "./map.js";
import { containsPattern } from "./query.js";
import type { Catalog, Db, DrugDetail, FmcgDetail } from "./types.js";

export const DRUG_SEARCH_SQL = `
SELECT product_id, product_name, marketer_name, medicine_type, product_form,
       mrp, prescription_required, package, qty_amount, qty_unit
FROM drugs
WHERE product_id = $1
   OR product_name ILIKE $2 ESCAPE '\\'
   OR marketer_name ILIKE $2 ESCAPE '\\'
   OR medicine_type ILIKE $2 ESCAPE '\\'
   OR product_form ILIKE $2 ESCAPE '\\'
ORDER BY product_name ASC, product_id ASC
LIMIT $3
`;

export const FMCG_SEARCH_SQL = `
SELECT product_id, product_name, marketer_name, marketing_company, type, product_form,
       mrp, package, qty_amount, qty_unit
FROM otc_fmcg
WHERE product_id = $1
   OR product_name ILIKE $2 ESCAPE '\\'
   OR marketer_name ILIKE $2 ESCAPE '\\'
   OR marketing_company ILIKE $2 ESCAPE '\\'
   OR type ILIKE $2 ESCAPE '\\'
   OR product_form ILIKE $2 ESCAPE '\\'
ORDER BY product_name ASC NULLS LAST, product_id ASC
LIMIT $3
`;

const DRUG_SQL = `
SELECT product_id, product_name, marketer_name, marketer_address, medicine_type,
       introduction, benefits, how_to_use, if_miss, packaging_detail, package,
       qty_amount, qty_unit, qty_raw, product_form, mrp, prescription_required,
       storage, how_it_works, country_of_origin, source_file
FROM drugs
WHERE product_id = $1
`;

const FMCG_SQL = `
SELECT product_id, product_name, marketing_company, type, packaging, package,
       qty_amount, qty_unit, qty_raw, product_form, mrp, information,
       directions_for_use, country_of_origin, marketer_name, marketer_address, source_file
FROM otc_fmcg
WHERE product_id = $1
`;

async function column(
  db: Db,
  sql: string,
  productId: string,
  key: string,
): Promise<Record<string, unknown>[]> {
  const result = await db.query(sql, [productId]);
  return result.rows.map((row) => ({ [key]: row[key] }));
}

export class PgCatalog implements Catalog {
  constructor(private readonly db: Db) {}

  async searchDrugs(query: string, limit: number) {
    const result = await this.db.query(DRUG_SEARCH_SQL, [query, containsPattern(query), limit]);
    return result.rows.map(mapDrugSummary);
  }

  async searchFmcg(query: string, limit: number) {
    const result = await this.db.query(FMCG_SEARCH_SQL, [query, containsPattern(query), limit]);
    return result.rows.map(mapFmcgSummary);
  }

  async findDrug(productId: string): Promise<DrugDetail | null> {
    const parent = await this.db.query(DRUG_SQL, [productId]);
    const row = parent.rows[0];
    if (!row) {
      return null;
    }
    const [ingredients, safety, facts, uses, sideEffects, questions, interactions, images] =
      await Promise.all([
        this.db.query(
          "SELECT name, strength, amount, unit FROM drug_ingredients WHERE product_id = $1 ORDER BY position ASC",
          [productId],
        ),
        this.db.query(
          "SELECT topic, level, detail FROM drug_safety WHERE product_id = $1 ORDER BY position ASC",
          [productId],
        ),
        this.db.query(
          "SELECT label, value FROM drug_facts WHERE product_id = $1 ORDER BY position ASC",
          [productId],
        ),
        this.db.query(
          "SELECT use_text FROM drug_uses WHERE product_id = $1 ORDER BY position ASC",
          [productId],
        ),
        this.db.query(
          "SELECT effect FROM drug_side_effects WHERE product_id = $1 ORDER BY position ASC",
          [productId],
        ),
        this.db.query(
          "SELECT question, answer FROM drug_questions WHERE product_id = $1 ORDER BY position ASC",
          [productId],
        ),
        this.db.query(
          "SELECT drug, route, severity, other_product, interacts_with, detail FROM drug_interactions WHERE product_id = $1 ORDER BY position ASC",
          [productId],
        ),
        this.db.query(
          "SELECT url FROM drug_images WHERE product_id = $1 ORDER BY position ASC",
          [productId],
        ),
      ]);
    return mapDrugDetail(row, {
      ingredients: ingredients.rows,
      safety: safety.rows,
      facts: facts.rows,
      uses: uses.rows,
      sideEffects: sideEffects.rows,
      questions: questions.rows,
      interactions: interactions.rows,
      images: images.rows,
    });
  }

  async findFmcg(productId: string): Promise<FmcgDetail | null> {
    const parent = await this.db.query(FMCG_SQL, [productId]);
    const row = parent.rows[0];
    if (!row) {
      return null;
    }
    const [categories, highlights, ingredients, benefits, safety, images] = await Promise.all([
      column(
        this.db,
        "SELECT segment FROM otc_fmcg_categories WHERE product_id = $1 ORDER BY position ASC",
        productId,
        "segment",
      ),
      column(
        this.db,
        "SELECT highlight FROM otc_fmcg_highlights WHERE product_id = $1 ORDER BY position ASC",
        productId,
        "highlight",
      ),
      column(
        this.db,
        "SELECT ingredient FROM otc_fmcg_ingredients WHERE product_id = $1 ORDER BY position ASC",
        productId,
        "ingredient",
      ),
      column(
        this.db,
        "SELECT benefit FROM otc_fmcg_benefits WHERE product_id = $1 ORDER BY position ASC",
        productId,
        "benefit",
      ),
      column(
        this.db,
        "SELECT safety_text FROM otc_fmcg_safety WHERE product_id = $1 ORDER BY position ASC",
        productId,
        "safety_text",
      ),
      column(
        this.db,
        "SELECT url FROM otc_fmcg_images WHERE product_id = $1 ORDER BY position ASC",
        productId,
        "url",
      ),
    ]);
    return mapFmcgDetail(row, { categories, highlights, ingredients, benefits, safety, images });
  }
}
