-- The demo clinic's patients for a local run.
--
-- The migration in db/migration seeds the shape of the clinic's own schema.
-- This file fills it with a set of patients that shows what the portal does:
-- who is waiting, who is with a doctor, who has been seen, who owes what, and
-- who carries conditions, allergies and a health ID.
--
-- A local run applies it. Nothing else reads it.

INSERT INTO patient (id, name, age, sex, phone, status, due, conditions, allergies, abha, last_seen) VALUES
    ('22222222-2222-2222-2222-222222222201', 'Reyansh Sharma', 25, 'M', '9845099505', 'waiting', 500, 'Heart disease', NULL, false, NULL),
    ('22222222-2222-2222-2222-222222222202', 'Roni Paul', 30, 'M', '9845094552', 'with-doctor', 0, NULL, NULL, false, NULL),
    ('22222222-2222-2222-2222-222222222203', 'Lakshmi Narayan', 61, 'F', '9845097719', 'seen', 0, 'High BP, Thyroid', NULL, true, 'Dr. Meghana Iyer'),
    ('22222222-2222-2222-2222-222222222204', 'Mohammed Irfan', 29, 'M', '9845094410', 'inactive', 0, NULL, NULL, false, NULL),
    ('22222222-2222-2222-2222-222222222205', 'Ravi Kumar', 45, 'M', '9845093021', 'seen', 0, 'Diabetes, High BP', 'Sulfa drugs', true, 'Dr. Ananya Rao'),
    ('22222222-2222-2222-2222-222222222206', 'Sneha Reddy', 8, 'F', '9845098812', 'inactive', 0, NULL, NULL, false, NULL),
    ('22222222-2222-2222-2222-222222222207', 'Anjali Menon', 34, 'F', '9845092805', 'waiting', 0, 'Hypertension', NULL, true, NULL),
    ('22222222-2222-2222-2222-222222222208', 'Vikram Joshi', 52, 'M', '9845096612', 'waiting', 1200, 'Type 2 diabetes', NULL, false, NULL),
    ('22222222-2222-2222-2222-222222222209', 'Meera Krishnan', 27, 'F', '9845093344', 'with-doctor', 0, 'Asthma', 'Penicillin', true, NULL),
    ('22222222-2222-2222-2222-222222222210', 'Suresh Kumar', 63, 'M', '9845097788', 'seen', 300, NULL, 'Sulfa drugs', true, 'Dr. Meghana Iyer'),
    ('22222222-2222-2222-2222-222222222211', 'Nisha Patel', 41, 'F', '9845095521', 'seen', 0, 'Migraine', NULL, false, 'Dr. Vikram Shenoy'),
    ('22222222-2222-2222-2222-222222222212', 'Arjun Nair', 19, 'M', '9845091177', 'waiting', 0, NULL, NULL, false, NULL),
    ('22222222-2222-2222-2222-222222222213', 'Deepa Rao', 56, 'F', '9845099003', 'inactive', 750, 'Thyroid', NULL, true, 'Dr. Ananya Rao'),
    ('22222222-2222-2222-2222-222222222214', 'Imran Sheikh', 37, 'M', '9845094466', 'seen', 0, NULL, NULL, false, 'Dr. Meghana Iyer')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    age = EXCLUDED.age,
    sex = EXCLUDED.sex,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status,
    due = EXCLUDED.due,
    conditions = EXCLUDED.conditions,
    allergies = EXCLUDED.allergies,
    abha = EXCLUDED.abha,
    last_seen = EXCLUDED.last_seen;
