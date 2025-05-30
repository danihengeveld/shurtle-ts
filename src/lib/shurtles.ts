import { db } from "@/db"
import { shurtleHits, shurtles } from "@/db/schema"
import { Geo, waitUntil } from "@vercel/functions"
import { count, eq, sql, sum } from "drizzle-orm"

export async function getStats(userId: string) {
  const statsResult = await db
    .select({
      totalHits: sum(shurtles.hits),
      totalShurtles: count(),
    })
    .from(shurtles)
    .where(eq(shurtles.creatorId, userId))

  const stats = {
    totalHits: statsResult[0]?.totalHits ? parseInt(statsResult[0].totalHits) : 0,
    totalShurtles: statsResult[0]?.totalShurtles || 0,
  }

  // Ensure totalHits is not null
  stats.totalHits = stats.totalHits || 0

  return stats
}

export async function getShurtlesPaginated(userId: string, page = 1, perPage = 10) {
  // Calculate offset
  const offset = (page - 1) * perPage

  const [paginatedUserShurtles, totalUserShurtles] = await db.batch([
    db.select()
      .from(shurtles)
      .where(eq(shurtles.creatorId, userId))
      .orderBy(sql`${shurtles.createdAt} DESC`)
      .limit(perPage)
      .offset(offset),
    db.select({ count: count() })
      .from(shurtles)
      .where(eq(shurtles.creatorId, userId))
  ]);

  const total = totalUserShurtles[0].count
  const totalPages = Math.ceil(total / perPage)

  return {
    shurtles: paginatedUserShurtles,
    totalPages,
    currentPage: page,
  }
}

const getUrlBySlugPrepared = db.query.shurtles.findFirst({
  where: (shurtles, { eq }) => eq(shurtles.slug, sql.placeholder('slug')),
  columns: {
    url: true
  },
}).prepare('getUrlBySlug')

db.transaction(async (tx) => { })

export async function getUrlBySlug(slug: string, requestGeo: Geo) {
  const shurtle = await getUrlBySlugPrepared.execute({ slug: slug })

  if (!shurtle) {
    return null
  }

  const coordinates = requestGeo.latitude && requestGeo.longitude
    ? { x: new Number(requestGeo.longitude).valueOf(), y: new Number(requestGeo.latitude).valueOf() }
    : null

  // We use waitUntil to ensure the hit is recorded even if the response is sent immediately
  waitUntil(db.transaction(async (tx) => {
    // Insert the hit record
    await tx.insert(shurtleHits).values({
      slug: slug,
      country: requestGeo.country,
      city: requestGeo.city,
      coordinates: coordinates
    })
    // Update the shurtle's hits and lastHitAt
    await tx.update(shurtles)
      .set({
        hits: sql`${shurtles.hits} + 1`,
        lastHitAt: sql`NOW()`
      })
      .where(eq(shurtles.slug, slug))
  }))

  return shurtle.url
}


