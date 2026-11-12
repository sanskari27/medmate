CREATE TABLE distributor (
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    gstin TEXT,
    drug_licence_number TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    payment_terms TEXT NOT NULL,
    opening_balance INTEGER NOT NULL,
    active BOOLEAN NOT NULL,
    show_in_purchases BOOLEAN NOT NULL,
    PRIMARY KEY (pharmacy_id, code),
    CONSTRAINT distributor_opening_balance CHECK (opening_balance >= 0),
    CONSTRAINT distributor_payment_terms CHECK (payment_terms IN (
        'Advance',
        'On delivery',
        '7 days credit',
        '15 days credit',
        '30 days credit',
        '45 days credit'))
);

CREATE TABLE distributor_transaction (
    pharmacy_id UUID NOT NULL,
    distributor_code TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    reference TEXT,
    note TEXT,
    mode TEXT,
    recorded_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (pharmacy_id, code),
    FOREIGN KEY (pharmacy_id, distributor_code) REFERENCES distributor (pharmacy_id, code) ON DELETE CASCADE,
    CONSTRAINT distributor_transaction_type CHECK (type IN ('purchase', 'payment', 'return')),
    CONSTRAINT distributor_transaction_amount CHECK (amount > 0),
    CONSTRAINT distributor_transaction_mode CHECK (
        mode IS NULL OR mode IN ('cash', 'upi', 'card', 'bank_transfer'))
);

CREATE INDEX distributor_transaction_distributor
    ON distributor_transaction (pharmacy_id, distributor_code, recorded_at, code);
