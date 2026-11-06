import "server-only"

import { db } from "@/db"
import { shurtleHits, shurtles } from "@/db/schema"
import type { Geo } from "@vercel/functions"
import { and, desc, eq, gt, gte, ilike, isNull, or, sql } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"
import { logger } from "./logger"
import type { DashboardQuery } from "./pagination"
import { shurtlesTag, statsTag } from "./tags"

export type ShurtleStats = {
  totalShurtles: number
  /** Shurtles that have not expired. */
  activeShurtles: number
  totalHits: number
}

export type DailyClicks = {
  /** UTC calendar day, `YYYY-MM-DD`. */
  date: string
  clicks: number
}

export async function getStats(userId: string): Promise<ShurtleStats> {
  "use cache"
  cacheTag(statsTag(userId))
  cacheLife("minutes")

  const [row] = await db
    .select({
      totalShurtles: sql<number>`count(*)::int`,
      activeShurtles: sql<number>`(count(*) filter (where ${shurtles.expiresAt} is null or ${shurtles.expiresAt} > now()))::int`,
      totalHits: sql<number>`coalesce(sum(${shurtles.hits}), 0)::int`,
    })
    .from(shurtles)
    .where(eq(shurtles.userId, userId))

  return row ?? { totalShurtles: 0, activeShurtles: 0, totalHits: 0 }
}

/** Clicks per UTC day for the last `days` days (oldest first, zero-filled, includes today). */
export async function getDailyClicks(userId: string, days = 30): Promise<DailyClicks[]> {
  "use cache"
  cacheTag(statsTag(userId))
  cacheLife("minutes")

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const since = new Date(today.getTime() - (days - 1) * 86_400_000)

  const day = sql<string>`to_char(date_trunc('day', ${shurtleHits.at} at time zone 'UTC'), 'YYYY-MM-DD')`
  const rows = await db
    .select({ date: day, clicks: sql<number>`count(*)::int` })
    .from(shurtleHits)
    .innerJoin(shurtles, eq(shurtles.slug, shurtleHits.slug))
    .where(and(eq(shurtles.userId, userId), gte(shurtleHits.at, since)))
    .groupBy(day)

  const clicksByDate = new Map(rows.map((row) => [row.date, row.clicks]))
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(since.getTime() + index * 86_400_000).toISOString().slice(0, 10)
    return { date, clicks: clicksByDate.get(date) ?? 0 }
  })
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

export async function getShurtlesPaginated(userId: string, { page, perPage, query }: DashboardQuery) {
  "use cache"
  cacheTag(shurtlesTag(userId))
  cacheLife("minutes")

  const pattern = `%${escapeLike(query)}%`
  const where = and(
    eq(shurtles.userId, userId),
    query ? or(ilike(shurtles.slug, pattern), ilike(shurtles.url, pattern)) : undefined,
  )

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(shurtles)
      .where(where)
      .orderBy(desc(shurtles.createdAt), shurtles.slug)
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.$count(shurtles, where),
  ])

  return {
    shurtles: rows,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / perPage)),
    page,
    perPage,
    query,
  }
}

const getUrlBySlugPrepared = db
  .select({ url: shurtles.url })
  .from(shurtles)
  .where(
    and(
      eq(shurtles.slug, sql.placeholder("slug")),
      or(isNull(shurtles.expiresAt), gt(shurtles.expiresAt, sql`now()`)),
    ),
  )
  .limit(1)
  .prepare("getUrlBySlug")

/** Resolve a slug to its destination, ignoring expired shurtles. */
export async function getUrlBySlug(slug: string) {
  const [row] = await getUrlBySlugPrepared.execute({ slug })
  return row?.url
}

function parseCoordinate(value: string | undefined) {
  const parsed = value === undefined ? Number.NaN : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Record a visit. Runs in the background after the redirect is sent; never throws. */
export async function recordHit(slug: string, geo: Geo) {
  const longitude = parseCoordinate(geo.longitude)
  const latitude = parseCoordinate(geo.latitude)

  try {
    await db.transaction(async (tx) => {
      await tx.insert(shurtleHits).values({
        slug,
        country: geo.country,
        region: geo.countryRegion,
        city: geo.city,
        coordinates: longitude !== null && latitude !== null ? { x: longitude, y: latitude } : null,
      })

      await tx
        .update(shurtles)
        .set({ hits: sql`${shurtles.hits} + 1`, lastHitAt: sql`now()` })
        .where(eq(shurtles.slug, slug))
    })
  } catch (error) {
    logger.error({ err: error, slug }, "failed to record hit")
  }
}
