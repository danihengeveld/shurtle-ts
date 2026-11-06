import { relations, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { index, integer, pgSchema, point, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const schema = pgSchema("shurtle");

export const shurtles = schema.table("shurtles", {
	slug: varchar("slug", { length: 255 }).primaryKey(),
	// `text`, not varchar(255): real-world URLs are routinely longer than 255 characters.
	// Length is validated in the app (see URL_MAX_LENGTH in src/lib/schemas.ts).
	url: text("url").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'date', precision: 0 }),
	hits: integer("hits").default(0).notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	lastHitAt: timestamp("last_hit_at", { withTimezone: true, mode: 'date', precision: 0 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'date', precision: 0 }).defaultNow().notNull()
}, (table) => [
	// Serves the dashboard list (filter by user, newest first) and per-user stats.
	index("user_id_created_at_idx").on(table.userId, table.createdAt.desc()),
	// One shurtle per destination per user, enforced even for concurrent creates. URLs are capped at
	// 2048 ASCII characters (normalized by URL parsing), well within the btree entry size limit.
	uniqueIndex("user_id_url_idx").on(table.userId, table.url)
])

export const shurtlesRelations = relations(shurtles, ({ many }) => ({
	hits: many(shurtleHits)
}))

export const shurtleHits = schema.table("hits", {
	id: uuid("id").primaryKey().defaultRandom(),
	slug: varchar("slug", { length: 255 }).notNull().references(() => shurtles.slug, { onDelete: 'cascade' }),
	at: timestamp("at", { withTimezone: true, mode: 'date', precision: 0 }).defaultNow().notNull(),
	country: varchar("country", { length: 255 }),
	region: varchar("region", { length: 255 }),
	city: varchar("city", { length: 255 }),
	coordinates: point("coordinates", { mode: 'xy' })
}, (table) => [
	// Serves the cascade on delete and the per-shurtle daily clicks range scan.
	index("slug_at_idx").on(table.slug, table.at),
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