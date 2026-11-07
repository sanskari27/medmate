-- Drug master tables. medicine-data applies this file on startup.
-- Rows are loaded outside this application.

CREATE TABLE IF NOT EXISTS drugs (
  product_id text PRIMARY KEY,
  product_name text NOT NULL,
  marketer_name text,
  marketer_address text,
  medicine_type text,
  introduction text,
  benefits text,
  how_to_use text,
  if_miss text,
  packaging_detail text,
  package text,
  qty_amount numeric,
  qty_unit text,
  qty_raw text,
  product_form text,
  mrp numeric(12, 2),
  prescription_required boolean NOT NULL,
  storage text,
  how_it_works text,
  country_of_origin text,
  source_file text
);

CREATE TABLE IF NOT EXISTS drug_ingredients (
  product_id text NOT NULL REFERENCES drugs (product_id),
  position integer NOT NULL,
  name text NOT NULL,
  strength text,
  amount numeric,
  unit text,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS drug_safety (
  product_id text NOT NULL REFERENCES drugs (product_id),
  position integer NOT NULL,
  topic text NOT NULL,
  level text,
  detail text,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS drug_facts (
  product_id text NOT NULL REFERENCES drugs (product_id),
  position integer NOT NULL,
  label text NOT NULL,
  value text,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS drug_uses (
  product_id text NOT NULL REFERENCES drugs (product_id),
  position integer NOT NULL,
  use_text text NOT NULL,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS drug_side_effects (
  product_id text NOT NULL REFERENCES drugs (product_id),
  position integer NOT NULL,
  effect text NOT NULL,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS drug_questions (
  product_id text NOT NULL REFERENCES drugs (product_id),
  position integer NOT NULL,
  question text NOT NULL,
  answer text,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS drug_interactions (
  product_id text NOT NULL REFERENCES drugs (product_id),
  position integer NOT NULL,
  drug text,
  route text,
  severity text,
  other_product text,
  interacts_with text,
  detail text,
  PRIMARY KEY (product_id, position)
);

CREATE TABLE IF NOT EXISTS drug_images (
  product_id text NOT NULL REFERENCES drugs (product_id),
  position integer NOT NULL,
  url text NOT NULL,
  PRIMARY KEY (product_id, position)
);

CREATE INDEX IF NOT EXISTS drugs_product_name_trgm ON drugs USING gin (product_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS drugs_marketer_name_trgm ON drugs USING gin (marketer_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS drugs_medicine_type_trgm ON drugs USING gin (medicine_type gin_trgm_ops);
CREATE INDEX IF NOT EXISTS drugs_product_form_trgm ON drugs USING gin (product_form gin_trgm_ops);
