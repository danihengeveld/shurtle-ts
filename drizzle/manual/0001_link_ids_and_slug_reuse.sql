-- Link ids and slug reuse.
--
-- Links get their own id (the slug was the primary key), hits point at that id, and a slug is
-- unique only among unreleased links, so an expired link's slug can be claimed again 24 hours
-- after it expires. `pnpm db:push` can't do this on a database with data (it can't backfill
-- hits.shurtle_id), so run this once, in a single transaction:
--
--   psql "$POSTGRES_URL" -f drizzle/manual/0001_link_ids_and_slug_reuse.sql
--
-- Afterwards `pnpm db:push` reports no changes. New databases don't need this: `pnpm db:push`
-- creates the current schema directly.

begin;

-- 1. Every link gets an id.
alter table shurtle.shurtles
  add column id uuid not null default gen_random_uuid();

-- 2. Hits point at the link's id instead of its slug.
alter table shurtle.hits add column shurtle_id uuid;

update shurtle.hits as hit
set shurtle_id = link.id
from shurtle.shurtles as link
where link.slug = hit.slug;

alter table shurtle.hits alter column shurtle_id set not null;
alter table shurtle.hits drop constraint hits_slug_shurtles_slug_fk;
drop index shurtle.slug_at_idx;
alter table shurtle.hits drop column slug;

-- 3. The id becomes the primary key. A slug stays unique among unreleased links only.
alter table shurtle.shurtles drop constraint shurtles_pkey;
alter table shurtle.shurtles add constraint shurtles_pkey primary key (id);

create unique index slug_live_idx on shurtle.shurtles using btree (slug)
  where archived_at is null;
create index slug_archived_at_idx on shurtle.shurtles
  using btree (slug, archived_at desc nulls first);

alter table shurtle.hits
  add constraint hits_shurtle_id_shurtles_id_fk foreign key (shurtle_id)
  references shurtle.shurtles (id) on delete cascade;
create index shurtle_id_at_idx on shurtle.hits using btree (shurtle_id, at);

commit;
