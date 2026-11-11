CREATE TABLE account (
    id UUID PRIMARY KEY,
    phone TEXT NOT NULL,
    account_type TEXT NOT NULL,
    display_name TEXT,
    disabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT account_phone_type UNIQUE (phone, account_type)
);

CREATE TABLE pharmacy (
    id UUID PRIMARY KEY,
    owner_account_id UUID NOT NULL UNIQUE REFERENCES account (id),
    verification_status TEXT NOT NULL,
    rejection_stage TEXT,
    rejection_comment TEXT,
    name TEXT,
    tagline TEXT,
    email TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    business_types TEXT NOT NULL DEFAULT '[]',
    industry TEXT,
    registration_type TEXT,
    gstin TEXT,
    pan TEXT,
    drug_licence_no TEXT,
    fssai_no TEXT,
    trade_licence_no TEXT,
    enable_tds BOOLEAN NOT NULL DEFAULT FALSE,
    enable_tcs BOOLEAN NOT NULL DEFAULT FALSE,
    pharmacist_name TEXT,
    invoice_prefix TEXT,
    terms TEXT,
    accept_online_orders BOOLEAN NOT NULL DEFAULT FALSE,
    self_order_kiosk BOOLEAN NOT NULL DEFAULT FALSE,
    e_invoicing BOOLEAN NOT NULL DEFAULT FALSE,
    loose_selling BOOLEAN NOT NULL DEFAULT FALSE,
    low_stock_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE pharmacy_document (
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id),
    slot TEXT NOT NULL,
    object_key TEXT NOT NULL,
    content_type TEXT NOT NULL,
    PRIMARY KEY (pharmacy_id, slot)
);

CREATE TABLE pharmacy_membership (
    account_id UUID PRIMARY KEY REFERENCES account (id),
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id)
);

CREATE TABLE staff_subtype (
    account_id UUID NOT NULL REFERENCES account (id),
    subtype TEXT NOT NULL,
    PRIMARY KEY (account_id, subtype)
);

CREATE TABLE pharmacy_permission (
    account_id UUID NOT NULL REFERENCES account (id),
    permission_key TEXT NOT NULL,
    PRIMARY KEY (account_id, permission_key)
);

CREATE TABLE pin_credential (
    account_id UUID PRIMARY KEY REFERENCES account (id),
    pin_hash TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE otp_challenge (
    phone TEXT NOT NULL,
    account_type TEXT NOT NULL,
    purpose TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL,
    PRIMARY KEY (phone, account_type, purpose)
);

CREATE TABLE refresh_session (
    token_hash TEXT PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES account (id),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE review_decision (
    id UUID PRIMARY KEY,
    pharmacy_id UUID NOT NULL REFERENCES pharmacy (id),
    stage TEXT NOT NULL,
    decision TEXT NOT NULL,
    comment TEXT,
    actor_account_id UUID NOT NULL REFERENCES account (id),
    created_at TIMESTAMPTZ NOT NULL
);
