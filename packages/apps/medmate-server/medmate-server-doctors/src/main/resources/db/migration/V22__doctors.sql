CREATE TABLE doctor (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    code_key TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    status TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    registration_council TEXT,
    registration_state TEXT,
    qualification TEXT NOT NULL,
    specialization TEXT NOT NULL,
    sub_specialization TEXT,
    years_experience INTEGER,
    primary_mobile TEXT NOT NULL,
    alternate_mobile TEXT,
    email TEXT,
    whatsapp TEXT,
    relationship_status TEXT,
    notes TEXT,
    workplace_name TEXT NOT NULL,
    workplace_type TEXT,
    address TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pin_code TEXT NOT NULL,
    workplace_phone TEXT,
    photo_key TEXT,
    photo_content_type TEXT,
    photo_file_name TEXT,
    CONSTRAINT doctor_code_unique UNIQUE (pharmacy_id, code_key),
    CONSTRAINT doctor_gender CHECK (gender IN ('male', 'female', 'other')),
    CONSTRAINT doctor_status CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX doctor_pharmacy_name ON doctor (pharmacy_id, lower(display_name), lower(code));

CREATE TABLE doctor_window (
    id UUID PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES doctor (id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    consultation_type TEXT NOT NULL,
    days TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    fee NUMERIC(12, 2) NOT NULL
);

CREATE INDEX doctor_window_doctor ON doctor_window (doctor_id, position);

CREATE TABLE doctor_document (
    id UUID PRIMARY KEY,
    doctor_id UUID NOT NULL REFERENCES doctor (id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    object_key TEXT NOT NULL,
    verification_status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT doctor_document_status CHECK (verification_status IN ('pending', 'verified', 'rejected'))
);

CREATE INDEX doctor_document_doctor ON doctor_document (doctor_id, created_at, id);
