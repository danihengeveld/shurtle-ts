-- Drop hit coordinates.
--
-- Shurtle used to store the latitude and longitude Vercel's geolocation gives for each click.
-- Since 3.1 nothing reads them (the analytics page lists countries and cities instead of drawing
-- a map), so they go. A click keeps its country, region and city only.
--
-- Deploy order matters: deploy the version without the column FIRST, then run this. Older
-- versions still insert `coordinates` with every click, and those inserts fail once the column
-- is gone. Run it once:
--
--   psql "$POSTGRES_URL" -f drizzle/manual/0002_drop_hit_coordinates.sql
--
-- `pnpm db:push` would drop the column too, after warning that it deletes data.
-- Afterwards `pnpm db:push` reports no changes. New databases don't need this: `pnpm db:push`
-- creates the current schema directly. The coordinates already stored are deleted with the
-- column; Postgres reclaims their space as rows are rewritten (or at once with `vacuum full`).

alter table shurtle.hits drop column if exists coordinates;
