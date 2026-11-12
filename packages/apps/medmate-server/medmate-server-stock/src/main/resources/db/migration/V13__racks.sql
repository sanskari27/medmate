ALTER TABLE inventory_product
    ADD COLUMN rack TEXT,
    ADD COLUMN rack_alt TEXT,
    ADD CONSTRAINT inventory_rack_present CHECK (rack IS NULL OR length(rack) > 0),
    ADD CONSTRAINT inventory_rack_alt_present CHECK (rack_alt IS NULL OR length(rack_alt) > 0);

CREATE TABLE rack (
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    PRIMARY KEY (pharmacy_id, code),
    CONSTRAINT rack_code_present CHECK (length(code) > 0)
);
