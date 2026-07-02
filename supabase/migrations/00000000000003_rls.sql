-- RLS: only `products` is publicly readable (storefront browsing).
-- Every other table has RLS enabled with zero grants to anon/authenticated,
-- so only the service-role key (used exclusively in server code) can read
-- or write them. This avoids hand-writing per-table policies for a
-- fast-moving MVP while staying secure by default.

alter table products enable row level security;
create policy "public can read products" on products for select using (true);

alter table customers enable row level security;
alter table sessions enable row level security;
alter table orders enable row level security;
alter table media_assets enable row level security;
alter table messages enable row level security;
alter table otp_codes enable row level security;
