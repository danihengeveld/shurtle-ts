import { sql } from "drizzle-orm";

import { index, integer, pgTableCreator, timestamp, varchar } from "drizzle-orm/pg-core";

const pgTable = pgTableCreator((name) => `shurtle_${name}`);

export const shurtles = pgTable(
  "shurtles",
  {
    slug: varchar("slug", { length: 255 }).primaryKey(),
    url: varchar("url", { length: 255 }).notNull(),
    hits: integer("hits").default(0).notNull(),

    creatorId: varchar("creatorId", { length: 255 }).notNull(),

    createdAt: timestamp("createdAt", { mode: "date", precision: 0, withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    lastHitAt: timestamp("lastHitAt", { mode: "date", precision: 0, withTimezone: true }),
  },
  (table) => {
    return {
      creatorIdIdx: index("creatorId_idx").on(table.creatorId),
    };
  }
);
