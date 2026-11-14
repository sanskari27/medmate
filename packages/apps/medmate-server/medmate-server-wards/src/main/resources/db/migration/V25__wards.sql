CREATE TABLE ward (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES department (id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    name_key TEXT NOT NULL,
    daily_rate NUMERIC(12, 2) NOT NULL,
    is_active BOOLEAN NOT NULL,
    CONSTRAINT ward_name_unique UNIQUE (pharmacy_id, name_key),
    CONSTRAINT ward_daily_rate CHECK (daily_rate >= 0)
);

CREATE INDEX ward_pharmacy_name ON ward (pharmacy_id, lower(name), id);

CREATE TABLE bed (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    ward_id UUID NOT NULL REFERENCES ward (id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    code_key TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    is_active BOOLEAN NOT NULL,
    CONSTRAINT bed_code_unique UNIQUE (ward_id, code_key),
    CONSTRAINT bed_category CHECK (category IN ('general', 'semi-private', 'private', 'icu')),
    CONSTRAINT bed_status CHECK (status IN ('vacant', 'occupied', 'maintenance'))
);

CREATE INDEX bed_pharmacy_status ON bed (pharmacy_id, is_active, status);

CREATE TABLE inpatient (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    gender TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT,
    emergency_name TEXT,
    emergency_phone TEXT,
    blood_group TEXT,
    allergies TEXT,
    conditions TEXT,
    attendant_name TEXT,
    attendant_phone TEXT,
    insurance TEXT,
    CONSTRAINT inpatient_phone_unique UNIQUE (pharmacy_id, phone),
    CONSTRAINT inpatient_gender CHECK (gender IN ('Male', 'Female', 'Other')),
    CONSTRAINT inpatient_blood CHECK (
        blood_group IS NULL OR blood_group IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'))
);

CREATE TABLE admission (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    inpatient_id UUID NOT NULL REFERENCES inpatient (id) ON DELETE RESTRICT,
    status TEXT NOT NULL,
    diagnosis TEXT,
    note TEXT,
    admitted_at TIMESTAMPTZ NOT NULL,
    discharged_at TIMESTAMPTZ,
    frozen_amount NUMERIC(16, 2),
    CONSTRAINT admission_status CHECK (status IN ('open', 'discharged'))
);

CREATE UNIQUE INDEX admission_one_open ON admission (inpatient_id) WHERE status = 'open';

CREATE INDEX admission_pharmacy_status ON admission (pharmacy_id, status);

CREATE TABLE admission_segment (
    id UUID PRIMARY KEY,
    admission_id UUID NOT NULL REFERENCES admission (id) ON DELETE CASCADE,
    ward_id UUID NOT NULL REFERENCES ward (id) ON DELETE RESTRICT,
    bed_id UUID NOT NULL REFERENCES bed (id) ON DELETE RESTRICT,
    doctor_id UUID NOT NULL REFERENCES doctor (id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    closed_by_transfer BOOLEAN NOT NULL
);

CREATE INDEX admission_segment_admission ON admission_segment (admission_id, started_at);
