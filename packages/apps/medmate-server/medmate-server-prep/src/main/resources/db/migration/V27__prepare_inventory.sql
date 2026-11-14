CREATE TABLE prep_list (
    id UUID PRIMARY KEY,
    owner_account_id UUID NOT NULL REFERENCES account (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT prep_list_name_owner UNIQUE (owner_account_id, name_key)
);

CREATE INDEX prep_list_owner_updated ON prep_list (owner_account_id, updated_at DESC, id DESC);

CREATE TABLE prep_line (
    list_id UUID NOT NULL REFERENCES prep_list (id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    batch_no TEXT NOT NULL,
    expiry TEXT,
    qty INTEGER,
    free_qty INTEGER,
    rate NUMERIC(12, 2),
    mrp NUMERIC(12, 2),
    gst SMALLINT,
    PRIMARY KEY (list_id, position),
    CONSTRAINT prep_line_batch UNIQUE (list_id, product_id, batch_no),
    CONSTRAINT prep_line_qty_non_negative CHECK (qty IS NULL OR qty >= 0),
    CONSTRAINT prep_line_free_non_negative CHECK (free_qty IS NULL OR free_qty >= 0),
    CONSTRAINT prep_line_gst CHECK (gst IS NULL OR gst IN (0, 5, 12, 18))
);
