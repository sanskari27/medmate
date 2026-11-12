CREATE TABLE purchase (
    pharmacy_id UUID NOT NULL,
    code TEXT NOT NULL,
    distributor_code TEXT NOT NULL,
    invoice_no TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    ledger_amount INTEGER NOT NULL,
    PRIMARY KEY (pharmacy_id, code),
    UNIQUE (pharmacy_id, distributor_code, invoice_no),
    FOREIGN KEY (pharmacy_id, distributor_code) REFERENCES distributor (pharmacy_id, code) ON DELETE CASCADE,
    CONSTRAINT purchase_ledger CHECK (ledger_amount >= 0)
);

CREATE TABLE purchase_line (
    pharmacy_id UUID NOT NULL,
    purchase_code TEXT NOT NULL,
    position INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    batch_no TEXT NOT NULL,
    expiry TEXT NOT NULL,
    qty INTEGER NOT NULL,
    free_qty INTEGER NOT NULL,
    rate NUMERIC(12, 2) NOT NULL,
    mrp NUMERIC(12, 2) NOT NULL,
    gst INTEGER NOT NULL,
    PRIMARY KEY (pharmacy_id, purchase_code, position),
    FOREIGN KEY (pharmacy_id, purchase_code) REFERENCES purchase (pharmacy_id, code) ON DELETE CASCADE,
    CONSTRAINT purchase_line_qty CHECK (qty >= 0 AND free_qty >= 0 AND qty + free_qty > 0),
    CONSTRAINT purchase_line_money CHECK (rate >= 0 AND mrp >= 0),
    CONSTRAINT purchase_line_gst CHECK (gst IN (0, 5, 12, 18))
);

CREATE TABLE purchase_return (
    pharmacy_id UUID NOT NULL,
    code TEXT NOT NULL,
    purchase_code TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    ledger_amount INTEGER NOT NULL,
    PRIMARY KEY (pharmacy_id, code),
    FOREIGN KEY (pharmacy_id, purchase_code) REFERENCES purchase (pharmacy_id, code) ON DELETE CASCADE,
    CONSTRAINT purchase_return_ledger CHECK (ledger_amount >= 0)
);

CREATE TABLE purchase_return_line (
    pharmacy_id UUID NOT NULL,
    return_code TEXT NOT NULL,
    position INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    free_qty INTEGER NOT NULL,
    PRIMARY KEY (pharmacy_id, return_code, position),
    FOREIGN KEY (pharmacy_id, return_code) REFERENCES purchase_return (pharmacy_id, code) ON DELETE CASCADE,
    CONSTRAINT purchase_return_line_qty CHECK (qty >= 0 AND free_qty >= 0 AND qty + free_qty > 0)
);

CREATE TABLE inventory_product (
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    marketer TEXT,
    composition TEXT,
    form TEXT,
    pack TEXT,
    product_type TEXT,
    reorder_level INTEGER NOT NULL,
    PRIMARY KEY (pharmacy_id, product_id),
    CONSTRAINT inventory_reorder CHECK (reorder_level >= 0)
);

CREATE TABLE inventory_batch (
    pharmacy_id UUID NOT NULL,
    product_id TEXT NOT NULL,
    batch_no TEXT NOT NULL,
    expiry TEXT NOT NULL,
    qty INTEGER NOT NULL,
    rate NUMERIC(12, 2) NOT NULL,
    mrp NUMERIC(12, 2) NOT NULL,
    PRIMARY KEY (pharmacy_id, product_id, batch_no),
    FOREIGN KEY (pharmacy_id, product_id) REFERENCES inventory_product (pharmacy_id, product_id) ON DELETE CASCADE,
    CONSTRAINT inventory_batch_qty CHECK (qty >= 0),
    CONSTRAINT inventory_batch_money CHECK (rate >= 0 AND mrp >= 0)
);

CREATE INDEX purchase_recorded ON purchase (pharmacy_id, recorded_at DESC, code DESC);
CREATE INDEX purchase_return_purchase ON purchase_return (pharmacy_id, purchase_code, recorded_at);
