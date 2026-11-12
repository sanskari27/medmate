CREATE TABLE employee (
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    dob DATE,
    joined_on DATE,
    employment TEXT NOT NULL,
    salary INTEGER NOT NULL,
    status TEXT NOT NULL,
    pan TEXT,
    aadhaar TEXT,
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    ifsc TEXT,
    upi TEXT,
    emergency_name TEXT,
    emergency_phone TEXT,
    note TEXT,
    blood_group TEXT,
    photo_key TEXT,
    photo_content_type TEXT,
    photo_file_name TEXT,
    PRIMARY KEY (pharmacy_id, code),
    CONSTRAINT employee_status CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE employee_document (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL,
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    object_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (pharmacy_id, code) REFERENCES employee (pharmacy_id, code) ON DELETE CASCADE
);

CREATE INDEX employee_document_employee ON employee_document (pharmacy_id, code, created_at, id);
