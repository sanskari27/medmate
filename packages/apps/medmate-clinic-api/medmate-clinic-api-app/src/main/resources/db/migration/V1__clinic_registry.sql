CREATE TABLE IF NOT EXISTS clinic_registry (
    clinic_id UUID PRIMARY KEY,
    database_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL
);

INSERT INTO clinic_registry (clinic_id, database_name, display_name)
VALUES ('11111111-1111-1111-1111-111111111111', 'medmate_clinic_11111111', 'Demo Clinic')
ON CONFLICT (clinic_id) DO NOTHING;
