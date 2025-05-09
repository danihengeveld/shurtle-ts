import { index, varchar, integer, timestamp, pgEnum, pgTableCreator } from "drizzle-orm/pg-core"

const pgTable = pgTableCreator((name) => `shurtle_${name}`)

export const shurtleShurtles = pgTable("shurtles", {
	slug: varchar("slug", { length: 255 }).primaryKey(),
	url: varchar("url", { length: 255 }).notNull(),
	hits: integer("hits").default(0).notNull(),
	creatorId: varchar("creator_id", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date', precision: 0 }).defaultNow().notNull(),
	lastHitAt: timestamp("last_hit_at", { withTimezone: true, mode: 'date', precision: 0 }),
}, (table) => [
	index("creator_id_idx").on(table.creatorId)
]);