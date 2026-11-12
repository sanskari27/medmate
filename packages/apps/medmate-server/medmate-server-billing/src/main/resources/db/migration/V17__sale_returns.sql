ALTER TABLE bill_line
    ADD COLUMN returned_qty INTEGER NOT NULL DEFAULT 0,
    ADD CONSTRAINT bill_line_returned CHECK (returned_qty >= 0 AND returned_qty <= qty);

CREATE TABLE sale_return (
    pharmacy_id UUID NOT NULL,
    code TEXT NOT NULL,
    bill_number TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    PRIMARY KEY (pharmacy_id, code),
    FOREIGN KEY (pharmacy_id, bill_number) REFERENCES bill (pharmacy_id, number) ON DELETE CASCADE,
    CONSTRAINT sale_return_amount CHECK (amount >= 0)
);

CREATE TABLE sale_return_line (
    pharmacy_id UUID NOT NULL,
    return_code TEXT NOT NULL,
    position INTEGER NOT NULL,
    bill_position INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    PRIMARY KEY (pharmacy_id, return_code, position),
    FOREIGN KEY (pharmacy_id, return_code) REFERENCES sale_return (pharmacy_id, code) ON DELETE CASCADE,
    CONSTRAINT sale_return_line_qty CHECK (qty >= 1),
    CONSTRAINT sale_return_line_amount CHECK (amount >= 0)
);
