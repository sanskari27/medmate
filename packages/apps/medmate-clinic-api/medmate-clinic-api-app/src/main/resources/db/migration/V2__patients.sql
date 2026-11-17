CREATE TABLE IF NOT EXISTS patient (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    sex TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT NOT NULL,
    due INTEGER NOT NULL DEFAULT 0,
    conditions TEXT,
    allergies TEXT,
    abha BOOLEAN NOT NULL DEFAULT false,
    last_seen TEXT
);

INSERT INTO patient (id, name, age, sex, phone, status, due, conditions, allergies, abha, last_seen) VALUES
    ('22222222-2222-2222-2222-222222222201', 'Reyansh Sharma', 25, 'M', '9845099505', 'waiting', 500, 'Heart disease', NULL, false, NULL),
    ('22222222-2222-2222-2222-222222222202', 'Roni Paul', 30, 'M', '9845094552', 'with-doctor', 0, NULL, NULL, false, NULL),
    ('22222222-2222-2222-2222-222222222203', 'Lakshmi Narayan', 61, 'F', '9845097719', 'inactive', 0, 'High BP, Thyroid', NULL, true, 'Dr. Meghana Iyer'),
    ('22222222-2222-2222-2222-222222222204', 'Mohammed Irfan', 29, 'M', '9845094410', 'inactive', 0, NULL, NULL, false, NULL),
    ('22222222-2222-2222-2222-222222222205', 'Ravi Kumar', 45, 'M', '9845093021', 'inactive', 0, 'Diabetes, High BP', 'Sulfa drugs', true, 'Dr. Ananya Rao'),
    ('22222222-2222-2222-2222-222222222206', 'Sneha Reddy', 8, 'F', '9845098812', 'inactive', 0, NULL, NULL, false, NULL)
ON CONFLICT (id) DO NOTHING;
