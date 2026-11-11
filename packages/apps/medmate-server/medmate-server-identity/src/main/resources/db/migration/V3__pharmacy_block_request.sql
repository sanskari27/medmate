CREATE TABLE pharmacy_block_request (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES account (id),
    requested_at TIMESTAMPTZ NOT NULL,
    decided_by UUID REFERENCES account (id),
    decided_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX pharmacy_block_request_one_open
    ON pharmacy_block_request (pharmacy_id)
    WHERE status = 'open';
