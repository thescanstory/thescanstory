-- Storage buckets for pre-order (session-scoped) and order-scoped uploads.
-- Both private: all access happens via server-minted signed URLs or the
-- service role client, never direct anon/authenticated access.

insert into storage.buckets (id, name, public)
values ('uploads-temp', 'uploads-temp', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('uploads-active', 'uploads-active', false)
on conflict (id) do nothing;
