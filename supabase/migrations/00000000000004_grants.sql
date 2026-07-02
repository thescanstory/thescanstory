-- service_role bypasses RLS but still needs table-level GRANTs — RLS and
-- GRANT are separate layers. anon/authenticated only need what their RLS
-- policies actually allow (public SELECT on products).

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to service_role;
grant select on products to anon, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant select on tables to anon, authenticated;
