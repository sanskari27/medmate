CREATE TABLE website_leads (
    id UUID PRIMARY KEY,
    site TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    pharmacy_name TEXT,
    city_pincode TEXT,
    area TEXT,
    city TEXT,
    preferred_time TEXT,
    monthly_sales TEXT,
    subject TEXT,
    message TEXT,
    source TEXT,
    notes TEXT,
    plan TEXT,
    consent BOOLEAN,
    CONSTRAINT website_leads_site CHECK (site IN ('nammamedmate', 'medmatepharmacy')),
    CONSTRAINT website_leads_type CHECK (type IN ('contact', 'demo', 'early-access', 'pharmacy-partner')),
    CONSTRAINT website_leads_status CHECK (status IN ('new', 'contacted'))
);

CREATE INDEX website_leads_page ON website_leads (created_at DESC, id DESC);
