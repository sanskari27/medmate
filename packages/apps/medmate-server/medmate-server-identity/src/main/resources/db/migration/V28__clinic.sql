ALTER TABLE account ADD COLUMN clinic_id UUID;
ALTER TABLE account ADD COLUMN clinic_role TEXT;

INSERT INTO account (id, phone, account_type, display_name, disabled, created_at, clinic_id, clinic_role)
VALUES
    (
        '11111111-1111-4111-8111-111111111101',
        '9845012345',
        'clinic',
        'Dr. Ananya Rao',
        FALSE,
        now(),
        '11111111-1111-1111-1111-111111111111',
        'owner'
    ),
    (
        '11111111-1111-4111-8111-111111111102',
        '9986041277',
        'clinic',
        'Dr. Vikram Shenoy',
        FALSE,
        now(),
        '11111111-1111-1111-1111-111111111111',
        'doctor'
    ),
    (
        '11111111-1111-4111-8111-111111111103',
        '9741022981',
        'clinic',
        'Dr. Meghana Iyer',
        FALSE,
        now(),
        '11111111-1111-1111-1111-111111111111',
        'doctor'
    ),
    (
        '11111111-1111-4111-8111-111111111104',
        '9886244120',
        'clinic',
        'Mary Joseph',
        FALSE,
        now(),
        '11111111-1111-1111-1111-111111111111',
        'nurse'
    ),
    (
        '11111111-1111-4111-8111-111111111105',
        '9900122331',
        'clinic',
        'Priya Shetty',
        FALSE,
        now(),
        '11111111-1111-1111-1111-111111111111',
        'front_desk'
    ),
    (
        '11111111-1111-4111-8111-111111111106',
        '9880433120',
        'clinic',
        'Kiran Bhat',
        FALSE,
        now(),
        '11111111-1111-1111-1111-111111111111',
        'admin'
    ),
    (
        '11111111-1111-4111-8111-111111111107',
        '9876500011',
        'clinic',
        'New Receptionist',
        FALSE,
        now(),
        '11111111-1111-1111-1111-111111111111',
        'front_desk'
    );