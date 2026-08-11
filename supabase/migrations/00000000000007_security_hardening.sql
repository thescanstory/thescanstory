-- Security hardening: OTP brute force protection, rate limiting, and idempotency key storage.

-- 1. Add attempts column to otp_codes to restrict verification to 3 tries.
alter table otp_codes add column attempts integer not null default 0;

-- 2. Create rate_limits table for serverless-safe rate limiting.
create table rate_limits (
  key text primary key,
  count integer not null,
  reset_at timestamptz not null
);

-- 3. Create idempotency_keys table for serverless-safe request deduplication.
create table idempotency_keys (
  key text primary key,
  response jsonb not null,
  created_at timestamptz not null default now()
);

-- Enable RLS to block all public access, allowing only the service_role key.
alter table rate_limits enable row level security;
alter table idempotency_keys enable row level security;

-- Grant permissions explicitly (in addition to default privileges).
grant select, insert, update, delete on rate_limits to service_role;
grant select, insert, update, delete on idempotency_keys to service_role;
