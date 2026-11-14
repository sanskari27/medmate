-- Optional name shown in place of the stored product name. Existing rows stay null.

ALTER TABLE drugs ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE otc_fmcg ADD COLUMN IF NOT EXISTS display_name text;

CREATE INDEX IF NOT EXISTS drugs_display_name_trgm ON drugs USING gin (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS otc_fmcg_display_name_trgm ON otc_fmcg USING gin (display_name gin_trgm_ops);
