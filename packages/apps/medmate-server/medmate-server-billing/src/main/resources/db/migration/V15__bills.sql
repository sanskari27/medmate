CREATE TABLE bill_counter (
    pharmacy_id UUID PRIMARY KEY REFERENCES pharmacy (id) ON DELETE CASCADE,
    last_number INTEGER NOT NULL,
    CONSTRAINT bill_counter_positive CHECK (last_number > 0)
);

CREATE TABLE bill (
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    prescribed_by TEXT,
    prescription_number TEXT,
    pay_mode TEXT NOT NULL,
    sold_at TIMESTAMPTZ NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) NOT NULL,
    payable NUMERIC(12, 2) NOT NULL,
    PRIMARY KEY (pharmacy_id, number),
    CONSTRAINT bill_pay CHECK (pay_mode = 'cash'),
    CONSTRAINT bill_phone CHECK (patient_phone ~ '^[0-9]{10}$'),
    CONSTRAINT bill_money CHECK (subtotal >= 0 AND discount >= 0 AND payable >= 0)
);

CREATE TABLE bill_line (
    pharmacy_id UUID NOT NULL,
    bill_number TEXT NOT NULL,
    position INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    composition TEXT,
    batch_no TEXT NOT NULL,
    expiry TEXT NOT NULL,
    qty INTEGER NOT NULL,
    mrp NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    gst INTEGER NOT NULL,
    offer_id TEXT,
    offer_title TEXT,
    discount NUMERIC(12, 2) NOT NULL,
    PRIMARY KEY (pharmacy_id, bill_number, position),
    FOREIGN KEY (pharmacy_id, bill_number) REFERENCES bill (pharmacy_id, number) ON DELETE CASCADE,
    CONSTRAINT bill_line_qty CHECK (qty >= 1),
    CONSTRAINT bill_line_gst CHECK (gst IN (0, 5, 12, 18)),
    CONSTRAINT bill_line_money CHECK (mrp >= 0 AND unit_price >= 0 AND discount >= 0)
);
