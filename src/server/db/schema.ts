import { sql, type InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgSchema,
  point,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const schema = pgSchema("shurtle");

export const shurtles = schema.table(
  "shurtles",
  {
    // The link's identity. Not the slug: a slug is reused once a link that expired has been
    // released (see src/lib/link-lifecycle.ts), and each link keeps its own click history.
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 255 }).notNull(),
    // `text`, not varchar(255): real-world URLs are routinely longer than 255 characters.
    // Length is validated in the app (see URL_MAX_LENGTH in src/lib/schemas.ts).
    url: text("url").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
      precision: 0,
    }),
    /** Clicks by people: bot visits are recorded in `hits` but not counted here. */
    hits: integer("hits").default(0).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    lastHitAt: timestamp("last_hit_at", {
      withTimezone: true,
      mode: "date",
      precision: 0,
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
      precision: 0,
    })
      .defaultNow()
      .notNull(),
    // Set when an expired shurtle is released: its slug and URL no longer count towards the unique
    // indexes below. That happens 24 hours after expiry (by the daily cron, or when someone claims
    // the slug), or early when the owner shortens the same URL again. A shurtle counts as expired
    // once `expires_at` has passed, released or not; see `isExpired` in src/server/queries.ts.
    // Expired shurtles are kept, never deleted automatically.
    archivedAt: timestamp("archived_at", {
      withTimezone: true,
      mode: "date",
      precision: 0,
    }),
  },
  (table) => [
    // One unreleased shurtle per slug: live and renewable links keep theirs, released ones don't.
    uniqueIndex("slug_live_idx")
      .on(table.slug)
      .where(sql`archived_at is null`),
    // Resolving a slug: the unreleased link if there is one, otherwise the latest released one.
    index("slug_archived_at_idx").on(
      table.slug,
      table.archivedAt.desc().nullsFirst(),
    ),
    // Serves the dashboard list (filter by user, newest first) and per-user stats.
    index("user_id_created_at_idx").on(table.userId, table.createdAt.desc()),
    // One unreleased shurtle per destination per user, enforced even for concurrent creates. Released
    // ones are excluded so a URL can be shortened again after its link expired. URLs are capped at 2048
    // ASCII characters (normalized by URL parsing), well within the btree entry size limit.
    uniqueIndex("user_id_url_idx")
      .on(table.userId, table.url)
      .where(sql`archived_at is null`),
  ],
);

/** What kind of device a visit came from; see `toVisit` in src/lib/visit.ts. */
export const deviceType = schema.enum("device_type", [
  "mobile",
  "tablet",
  "desktop",
  "other",
]);

export const shurtleHits = schema.table(
  "hits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shurtleId: uuid("shurtle_id")
      .notNull()
      .references(() => shurtles.id, { onDelete: "cascade" }),
    at: timestamp("at", { withTimezone: true, mode: "date", precision: 0 })
      .defaultNow()
      .notNull(),
    country: varchar("country", { length: 255 }),
    region: varchar("region", { length: 255 }),
    city: varchar("city", { length: 255 }),
    coordinates: point("coordinates", { mode: "xy" }),
    // Visit details (see src/lib/visit.ts). Never the raw user agent, the full referring URL or the
    // IP address. Hits recorded before these columns existed have no device: the analytics page
    // shows their source and device as unknown.
    /** Host of the referring site (`x.com`), or null for a direct visit. */
    referrer: varchar("referrer", { length: 255 }),
    device: deviceType("device"),
    browser: varchar("browser", { length: 64 }),
    os: varchar("os", { length: 64 }),
    /** Crawlers and link-preview fetchers: stored, but left out of every count and chart. */
    isBot: boolean("is_bot").default(false).notNull(),
  },
  (table) => [
    // Serves the cascade on delete, the per-user daily clicks join and every per-link analytics
    // query (hits by link and time).
    index("shurtle_id_at_idx").on(table.shurtleId, table.at),
    index("at_idx").on(table.at.desc()),
    index("country_idx").on(table.country),
  ],
);

export type Shurtle = InferSelectModel<typeof shurtles>;
