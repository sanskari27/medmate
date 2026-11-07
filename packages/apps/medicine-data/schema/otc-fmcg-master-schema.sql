-- OTC/FMCG master tables. medicine-data applies this file on startup.
-- This catalog is separate from the drug master.
-- Rows are loaded outside this application.

CREATE TABLE IF NOT EXISTS otc_fmcg (
  product_id text PRIMARY KEY,
  product_name text,
  marketing_company text,
  type text,
  packaging text,
  package text,
  qty_amount numeric,
  qty_unit text,
  qty_raw text,
  product_form text,
  mrp numeric(12, 2),
  information text,
  directions_for_use text,
  country_of_origin text,
  marketer_name text,
  marketer_address text,
  source_file text
);

CREATE TABLE IF NOT EXISTS otc_fmcg_categories (
  product_id text NOT NULL REFERENCES otc_fmcg (product_id),
  position integer NOT NULL,
  segment text NOT NULL,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS otc_fmcg_highlights (
  product_id text NOT NULL REFERENCES otc_fmcg (product_id),
  position integer NOT NULL,
  highlight text NOT NULL,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS otc_fmcg_ingredients (
  product_id text NOT NULL REFERENCES otc_fmcg (product_id),
  position integer NOT NULL,
  ingredient text NOT NULL,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS otc_fmcg_benefits (
  product_id text NOT NULL REFERENCES otc_fmcg (product_id),
  position integer NOT NULL,
  benefit text NOT NULL,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS otc_fmcg_safety (
  product_id text NOT NULL REFERENCES otc_fmcg (product_id),
  position integer NOT NULL,
  safety_text text NOT NULL,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS otc_fmcg_images (
  product_id text NOT NULL REFERENCES otc_fmcg (product_id),
  position integer NOT NULL,
  url text NOT NULL,
  PRIMARY KEY (product_id, position)
);

CREATE INDEX IF NOT EXISTS otc_fmcg_product_name_trgm ON otc_fmcg USING gin (product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS otc_fmcg_marketer_name_trgm ON otc_fmcg USING gin (marketer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS otc_fmcg_marketing_company_trgm ON otc_fmcg USING gin (marketing_company gin_trgm_ops);
CREATE INDEX IF NOT EXISTS otc_fmcg_type_trgm ON otc_fmcg USING gin (type gin_trgm_ops);
CREATE INDEX IF NOT EXISTS otc_fmcg_product_form_trgm ON otc_fmcg USING gin (product_form gin_trgm_ops);
