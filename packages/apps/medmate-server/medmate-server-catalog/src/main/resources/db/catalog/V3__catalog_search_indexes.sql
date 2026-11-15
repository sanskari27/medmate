-- flyway:executeInTransaction=false
-- Name order for a limited page, and prefix lookup for form and type.
-- Concurrent builds keep reads available on an already populated catalog.

CREATE INDEX CONCURRENTLY IF NOT EXISTS drugs_product_name_id ON drugs (product_name, product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS drugs_display_name_id ON drugs (display_name, product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS drugs_marketer_name_id ON drugs (marketer_name, product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS drugs_form_name_id
    ON drugs ((lower(product_form)) text_pattern_ops, product_name, product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS drugs_type_name_id
    ON drugs ((lower(medicine_type)) text_pattern_ops, product_name, product_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS otc_fmcg_product_name_id
    ON otc_fmcg (product_name ASC NULLS LAST, product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS otc_fmcg_display_name_id ON otc_fmcg (display_name, product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS otc_fmcg_marketer_name_id ON otc_fmcg (marketer_name, product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS otc_fmcg_marketing_company_id ON otc_fmcg (marketing_company, product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS otc_fmcg_form_name_id
    ON otc_fmcg ((lower(product_form)) text_pattern_ops, product_name ASC NULLS LAST, product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS otc_fmcg_type_name_id
    ON otc_fmcg ((lower(type)) text_pattern_ops, product_name ASC NULLS LAST, product_id);
