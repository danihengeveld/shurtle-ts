import { sql } from "drizzle-orm";
import {
  datetime,
  index,
  int,
  mysqlTable,
  varchar,
} from "drizzle-orm/mysql-core";

export const shurtles = mysqlTable(
  "Shurtle",
  {
    slug: varchar("slug", { length: 255 }).primaryKey(),
    url: varchar("url", { length: 255 }).notNull(),
    hits: int("hits").default(0).notNull(),

    creatorId: varchar("creatorId", { length: 255 }).notNull(),

    createdAt: datetime("createdAt", { mode: 'string', fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).notNull(),
	lastHitAt: datetime("lastHitAt", { mode: 'string', fsp: 3 }),
  },
  (table) => {
    return {
      creatorIdIdx: index("creatorId_idx").on(table.creatorId),
    };
  }
);
