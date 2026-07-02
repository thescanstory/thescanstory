-- Scan Story core schema

create extension if not exists pgcrypto;

create type product_type as enum ('frame', 'wallet_card', 'tshirt');
create type order_status as enum ('pending', 'paid', 'cod_pending', 'shipped', 'delivered');
create type payment_method_t as enum ('online', 'cod');
create type payment_status_t as enum ('unpaid', 'paid', 'failed', 'refunded');
create type media_type as enum ('target_photo', 'video');

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type product_type not null,
  price_paise integer not null check (price_paise >= 0),
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  product_id uuid not null references products(id),
  status order_status not null default 'pending',
  payment_method payment_method_t not null,
  payment_status payment_status_t not null default 'unpaid',
  cod_verified boolean not null default false,
  cod_handling_fee_paise integer not null default 4900,
  shipping_address jsonb not null,
  phone text not null,
  email text not null,
  experience_slug text not null unique,
  razorpay_order_id text,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on orders(status);
create index orders_payment_method_idx on orders(payment_method);
create index orders_created_at_idx on orders(created_at desc);

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  order_id uuid references orders(id) on delete cascade,
  type media_type not null,
  storage_bucket text not null,
  storage_path text not null,
  mind_target_path text,
  cached_confirmed boolean not null default false,
  uploaded_at timestamptz not null default now(),
  check (session_id is not null or order_id is not null)
);
create index media_assets_session_idx on media_assets(session_id);
create index media_assets_order_idx on media_assets(order_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  order_id uuid references orders(id) on delete cascade,
  text_content text not null,
  created_at timestamptz not null default now(),
  check (session_id is not null or order_id is not null)
);

create table otp_codes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  phone text not null,
  code text not null,
  verified boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index otp_codes_session_idx on otp_codes(session_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_set_updated_at
before update on orders
for each row execute function set_updated_at();
