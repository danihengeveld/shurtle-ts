import { sql, type InferSelectModel } from "drizzle-orm";
import {
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
    slug: varchar("slug", { length: 255 }).primaryKey(),
    // `text`, not varchar(255): real-world URLs are routinely longer than 255 characters.
    // Length is validated in the app (see URL_MAX_LENGTH in src/lib/schemas.ts).
    url: text("url").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
      precision: 0,
    }),
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
    // Set when an expired shurtle is archived (by the daily cron, or when its URL is shortened again).
    // A shurtle counts as expired once `expires_at` has passed, even before it is archived; see
    // `isExpired` in src/server/queries.ts. Expired shurtles are kept, never deleted automatically.
    archivedAt: timestamp("archived_at", {
      withTimezone: true,
      mode: "date",
      precision: 0,
    }),
  },
  (table) => [
    // Serves the dashboard list (filter by user, newest first) and per-user stats.
    index("user_id_created_at_idx").on(table.userId, table.createdAt.desc()),
    // One live shurtle per destination per user, enforced even for concurrent creates. Archived ones
    // are excluded so a URL can be shortened again after its link expired. URLs are capped at 2048
    // ASCII characters (normalized by URL parsing), well within the btree entry size limit.
    uniqueIndex("user_id_url_idx")
      .on(table.userId, table.url)
      .where(sql`archived_at is null`),
  ],
);

export const shurtleHits = schema.table(
  "hits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 255 })
      .notNull()
      .references(() => shurtles.slug, { onDelete: "cascade" }),
    at: timestamp("at", { withTimezone: true, mode: "date", precision: 0 })
      .defaultNow()
      .notNull(),
    country: varchar("country", { length: 255 }),
    region: varchar("region", { length: 255 }),
    city: varchar("city", { length: 255 }),
    coordinates: point("coordinates", { mode: "xy" }),
  },
  (table) => [
    // Serves the cascade on delete and the per-user daily clicks join (hits by slug and time).
    index("slug_at_idx").on(table.slug, table.at),
    index("at_idx").on(table.at.desc()),
    index("country_idx").on(table.country),
  ],
);

export type Shurtle = InferSelectModel<typeof shurtles>;
