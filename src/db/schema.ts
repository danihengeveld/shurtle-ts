import { relations, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { index, integer, pgSchema, point, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const schema = pgSchema("shurtle");

export const shurtles = schema.table("shurtles", {
	slug: varchar("slug", { length: 255 }).primaryKey(),
	url: varchar("url", { length: 255 }).notNull(),
	hits: integer("hits").default(0).notNull(),
	creatorId: varchar("creator_id", { length: 255 }).notNull(),
	lastHitAt: timestamp("last_hit_at", { withTimezone: true, mode: 'date', precision: 0 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date', precision: 0 }).defaultNow().notNull()
}, (table) => [
	index("creator_id_idx").on(table.creatorId)
])

export const shurtlesRelations = relations(shurtles, ({ many }) => ({
	hits: many(shurtleHits)
}))

export const shurtleHits = schema.table("hits", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: varchar("slug", { length: 255 }).notNull().references(() => shurtles.slug, { onDelete: 'cascade' }),
	at: timestamp("at", { withTimezone: true, mode: 'date', precision: 0 }).defaultNow().notNull(),
	country: varchar("country", { length: 255 }),
	city: varchar("city", { length: 255 }),
	coordinates: point("coordinates", { mode: 'xy' })
}, (table) => [
	index("slug_idx").on(table.slug),
	index("at_idx").on(table.at.desc()),
	index("country_idx").on(table.country)
])

export const shurtleHitsRelations = relations(shurtleHits, ({ one }) => ({
	shurtle: one(shurtles, {
		fields: [shurtleHits.slug],
		references: [shurtles.slug]
	})
}))

export type Shurtle = InferSelectModel<typeof shurtles>
export type ShurtleInsert = InferInsertModel<typeof shurtles>

export type ShurtleHit = InferSelectModel<typeof shurtleHits>
export type ShurtleHitInsert = InferInsertModel<typeof shurtleHits>