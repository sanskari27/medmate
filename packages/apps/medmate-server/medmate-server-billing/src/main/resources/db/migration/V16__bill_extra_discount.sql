ALTER TABLE bill
    ADD COLUMN extra_type TEXT NOT NULL DEFAULT 'none',
    ADD COLUMN extra_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN extra_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD CONSTRAINT bill_extra_type CHECK (extra_type IN ('none', 'percent', 'flat')),
    ADD CONSTRAINT bill_extra_money CHECK (extra_value >= 0 AND extra_amount >= 0),
    ADD CONSTRAINT bill_extra_percent CHECK (extra_type <> 'percent' OR extra_value <= 100);
