import { type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { bigserial, index, pgTableCreator, point, timestamp, varchar } from "drizzle-orm/pg-core";

const pgTable = pgTableCreator((name) => `shurtle_${name}`)

export const shurtles = pgTable("shurtles", {
	slug: varchar("slug", { length: 255 }).primaryKey(),
	url: varchar("url", { length: 255 }).notNull(),
	creatorId: varchar("creator_id", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date', precision: 0 }).defaultNow().notNull()
}, (table) => [
	index("creator_id_idx").on(table.creatorId)
])

export const shurtleHits = pgTable("hits", {
	id: bigserial("id", { mode: "bigint" }).primaryKey(),
	slug: varchar("slug", { length: 255 }).notNull().references(() => shurtles.slug, { onDelete: 'cascade' }),
	at: timestamp("at", { withTimezone: true, mode: 'date', precision: 0 }).defaultNow().notNull(),
	fromCountry: varchar("from_country", { length: 255 }),
	fromCity: varchar("from_city", { length: 255 }),
	fromLocation: point("from_location", { mode: 'xy' })
}, (table) => [
	index("slug_idx").on(table.slug)
])

export type Shurtle = InferSelectModel<typeof shurtles>
export type ShurtleInsert = InferInsertModel<typeof shurtles>

export type ShurtleHit = InferSelectModel<typeof shurtleHits>
export type ShurtleHitInsert = InferInsertModel<typeof shurtleHits>