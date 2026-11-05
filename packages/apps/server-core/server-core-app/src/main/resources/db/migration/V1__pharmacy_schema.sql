CREATE TABLE pharmacies (
  id uuid PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  business_type text NOT NULL,
  setup_complete boolean NOT NULL DEFAULT false,
  pricing_pin text NOT NULL,
  state jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token text PRIMARY KEY,
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  phone text NOT NULL,
  pricing_unlocked boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  impersonator text,
  refresh_hash text,
  refresh_previous text,
  refresh_expires_at timestamptz
);

CREATE UNIQUE INDEX sessions_refresh_hash ON sessions (refresh_hash) WHERE refresh_hash IS NOT NULL;

CREATE TABLE idempotency (
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  key text NOT NULL,
  request_hash text NOT NULL,
  status int NOT NULL,
  body jsonb NOT NULL,
  PRIMARY KEY (pharmacy_id, key)
);

CREATE TABLE files (
  id text PRIMARY KEY,
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  bytes bytea,
  s3_key text
);

CREATE TABLE staff_phones (
  phone text PRIMARY KEY,
  pharmacy_id uuid NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  login_pin_hash text
);

CREATE TABLE otp_challenges (
  phone text PRIMARY KEY,
  otp_hash text,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now(),
  send_count int NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE master_phones (
  phone text PRIMARY KEY
);

CREATE TABLE master_sessions (
  token text PRIMARY KEY,
  phone text NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE TABLE consultations (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  area text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE master_audit (
  id bigserial PRIMARY KEY,
  phone text NOT NULL,
  pharmacy_id uuid NOT NULL,
  action text NOT NULL,
  "before" jsonb NOT NULL,
  "after" jsonb NOT NULL,
  reason text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION master_audit_freeze() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'master_audit is append-only';
END $$;

CREATE TRIGGER master_audit_freeze
BEFORE UPDATE OR DELETE ON master_audit
FOR EACH ROW EXECUTE FUNCTION master_audit_freeze();

REVOKE UPDATE, DELETE ON master_audit FROM PUBLIC;

CREATE TABLE coupons (
  code text PRIMARY KEY,
  plan text NOT NULL,
  expires_on date NOT NULL,
  valid_days int NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE coupon_redemptions (
  pharmacy_id uuid PRIMARY KEY REFERENCES pharmacies(id) ON DELETE CASCADE,
  code text NOT NULL REFERENCES coupons(code),
  redeemed_at timestamptz NOT NULL DEFAULT now()
);
