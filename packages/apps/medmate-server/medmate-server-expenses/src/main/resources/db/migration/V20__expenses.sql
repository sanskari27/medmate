CREATE TABLE expense (
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    seq INTEGER NOT NULL,
    number TEXT NOT NULL,
    spent_on DATE NOT NULL,
    party TEXT NOT NULL,
    category TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    gst SMALLINT NOT NULL,
    note TEXT,
    PRIMARY KEY (pharmacy_id, number),
    UNIQUE (pharmacy_id, seq),
    CONSTRAINT expense_seq CHECK (seq > 0),
    CONSTRAINT expense_amount CHECK (amount > 0),
    CONSTRAINT expense_mode CHECK (payment_mode IN ('cash', 'upi', 'card', 'cod')),
    CONSTRAINT expense_gst CHECK (gst IN (0, 5, 12, 18, 28))
);

CREATE INDEX expense_page ON expense (pharmacy_id, spent_on DESC, seq DESC);
