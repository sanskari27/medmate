DROP TABLE admission_segment;
DROP TABLE admission;
DROP TABLE inpatient;
DROP TABLE bed;
DROP TABLE ward;

CREATE TABLE ward (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    code_key TEXT NOT NULL,
    floor TEXT,
    category TEXT NOT NULL,
    beds INTEGER NOT NULL,
    sister TEXT,
    daily_rate NUMERIC(14, 2) NOT NULL,
    beds_held INTEGER NOT NULL,
    under_maintenance BOOLEAN NOT NULL,
    maintenance_note TEXT,
    CONSTRAINT ward_code_unique UNIQUE (pharmacy_id, code_key),
    CONSTRAINT ward_beds CHECK (beds BETWEEN 1 AND 200),
    CONSTRAINT ward_held CHECK (beds_held >= 0 AND beds_held <= beds),
    CONSTRAINT ward_rate CHECK (daily_rate >= 0)
);

CREATE INDEX ward_pharmacy_name ON ward (pharmacy_id, lower(name), lower(code));

CREATE TABLE admission (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    ward_id UUID NOT NULL REFERENCES ward (id) ON DELETE RESTRICT,
    patient_name TEXT NOT NULL,
    uhid TEXT NOT NULL,
    uhid_key TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    gender TEXT,
    bed TEXT NOT NULL,
    bed_number INTEGER NOT NULL,
    doctor TEXT,
    diagnosis TEXT,
    payer_type TEXT NOT NULL,
    insurer TEXT,
    policy_no TEXT,
    admitted_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    discharged_at TIMESTAMPTZ,
    settled_amount NUMERIC(14, 2),
    pay_mode TEXT,
    rate_used NUMERIC(14, 2),
    CONSTRAINT admission_status CHECK (status IN ('admitted', 'discharged')),
    CONSTRAINT admission_payer CHECK (payer_type IN ('self', 'insurance')),
    CONSTRAINT admission_bed_number CHECK (bed_number >= 1)
);

CREATE UNIQUE INDEX admission_active_uhid ON admission (pharmacy_id, uhid_key) WHERE status = 'admitted';

CREATE INDEX admission_pharmacy_open ON admission (pharmacy_id, status, admitted_at DESC);
