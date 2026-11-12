CREATE TABLE offer (
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    coupon TEXT NOT NULL,
    discount_type TEXT NOT NULL,
    discount_value NUMERIC(12, 2) NOT NULL,
    scope TEXT NOT NULL,
    product_id TEXT,
    online BOOLEAN NOT NULL,
    active BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (pharmacy_id, code),
    CONSTRAINT offer_type CHECK (discount_type IN ('pct', 'flat')),
    CONSTRAINT offer_scope CHECK (scope IN ('all', 'product')),
    CONSTRAINT offer_value CHECK (discount_value > 0),
    CONSTRAINT offer_target CHECK (
        (scope = 'all' AND product_id IS NULL) OR (scope = 'product' AND product_id IS NOT NULL)
    )
);

CREATE TABLE offer_code (
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    last_number INTEGER NOT NULL,
    PRIMARY KEY (pharmacy_id),
    CONSTRAINT offer_code_positive CHECK (last_number > 0)
);

CREATE INDEX offer_created ON offer (pharmacy_id, created_at DESC, code DESC);
