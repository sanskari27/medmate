ALTER TABLE bill DROP CONSTRAINT bill_pay;
ALTER TABLE bill ADD CONSTRAINT bill_pay CHECK (pay_mode IN ('cash', 'credit'));

CREATE INDEX bill_patient_phone ON bill (pharmacy_id, patient_phone);

CREATE TABLE patient_profile (
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    blood_group TEXT,
    dob TEXT,
    address TEXT,
    conditions TEXT,
    allergies TEXT,
    note TEXT,
    consent BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (pharmacy_id, phone),
    CONSTRAINT patient_profile_phone CHECK (phone ~ '^[0-9]{10}$'),
    CONSTRAINT patient_profile_age CHECK (age IS NULL OR (age >= 0 AND age <= 120)),
    CONSTRAINT patient_profile_gender CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'Other'))
);

CREATE TABLE credit_repayment_counter (
    pharmacy_id UUID PRIMARY KEY REFERENCES pharmacy (id) ON DELETE CASCADE,
    last_number INTEGER NOT NULL,
    CONSTRAINT credit_repayment_counter_positive CHECK (last_number > 0)
);

CREATE TABLE credit_repayment (
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    phone TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    mode TEXT NOT NULL,
    note TEXT,
    recorded_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (pharmacy_id, code),
    CONSTRAINT credit_repayment_amount CHECK (amount > 0),
    CONSTRAINT credit_repayment_mode CHECK (mode IN ('cash', 'upi', 'card')),
    CONSTRAINT credit_repayment_phone CHECK (phone ~ '^[0-9]{10}$')
);

CREATE TABLE patient_reminder (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    kind TEXT NOT NULL,
    channel TEXT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT patient_reminder_kind CHECK (kind IN ('refill', 'adherence', 'followup', 'winback')),
    CONSTRAINT patient_reminder_channel CHECK (channel IN ('whatsapp', 'sms')),
    CONSTRAINT patient_reminder_phone CHECK (phone ~ '^[0-9]{10}$')
);

CREATE TABLE loyalty_redemption (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    points INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT loyalty_redemption_points CHECK (points > 0),
    CONSTRAINT loyalty_redemption_phone CHECK (phone ~ '^[0-9]{10}$')
);

CREATE TABLE crm_campaign (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    segment TEXT NOT NULL,
    channel TEXT NOT NULL,
    message TEXT NOT NULL,
    offer_label TEXT,
    reach INTEGER NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT crm_campaign_channel CHECK (channel IN ('whatsapp', 'sms')),
    CONSTRAINT crm_campaign_reach CHECK (reach >= 0)
);

CREATE TABLE patient_feedback (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    rating INTEGER NOT NULL,
    nps INTEGER,
    comment TEXT,
    recorded_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT patient_feedback_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT patient_feedback_nps CHECK (nps IS NULL OR (nps BETWEEN 0 AND 10)),
    CONSTRAINT patient_feedback_phone CHECK (phone ~ '^[0-9]{10}$')
);
