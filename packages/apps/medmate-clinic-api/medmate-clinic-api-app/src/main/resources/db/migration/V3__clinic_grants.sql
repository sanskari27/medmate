CREATE TABLE IF NOT EXISTS clinic_grant (
    account_id UUID NOT NULL,
    grant_key TEXT NOT NULL,
    PRIMARY KEY (account_id, grant_key)
);

INSERT INTO clinic_grant (account_id, grant_key) VALUES
    ('11111111-1111-4111-8111-111111111101', 'clinic:patients:read'),
    ('11111111-1111-4111-8111-111111111101', 'clinic:patients:read_clinical'),
    ('11111111-1111-4111-8111-111111111101', 'clinic:billing:read'),
    ('11111111-1111-4111-8111-111111111101', 'clinic:staff:read'),
    ('11111111-1111-4111-8111-111111111102', 'clinic:patients:read'),
    ('11111111-1111-4111-8111-111111111102', 'clinic:patients:read_clinical'),
    ('11111111-1111-4111-8111-111111111102', 'clinic:billing:read'),
    ('11111111-1111-4111-8111-111111111103', 'clinic:patients:read'),
    ('11111111-1111-4111-8111-111111111103', 'clinic:patients:read_clinical'),
    ('11111111-1111-4111-8111-111111111103', 'clinic:billing:read'),
    ('11111111-1111-4111-8111-111111111104', 'clinic:patients:read'),
    ('11111111-1111-4111-8111-111111111104', 'clinic:patients:read_clinical'),
    ('11111111-1111-4111-8111-111111111105', 'clinic:patients:read'),
    ('11111111-1111-4111-8111-111111111105', 'clinic:billing:read'),
    ('11111111-1111-4111-8111-111111111106', 'clinic:patients:read'),
    ('11111111-1111-4111-8111-111111111106', 'clinic:staff:read')
ON CONFLICT (account_id, grant_key) DO NOTHING;
