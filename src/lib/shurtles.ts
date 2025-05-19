import { db } from "@/db"
import { shurtles } from "@/db/schema"
import { count, eq, sql, sum } from "drizzle-orm"

// Separate function to get user stats (won't be refetched during pagination)
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

// Function to get paginated shurtles
export async function getShurtlesPaginated(userId: string, page = 1, perPage = 10) {
  // Calculate offset
  const offset = (page - 1) * perPage

  // Get paginated shurtles
  const userShurtles = await db
    .select()
    .from(shurtles)
    .where(eq(shurtles.creatorId, userId))
    .orderBy(sql`${shurtles.createdAt} DESC`)
    .limit(perPage)
    .offset(offset)

  // Get total count for pagination
  const countResult = await db.select({ count: count() }).from(shurtles).where(eq(shurtles.creatorId, userId))

  const total = countResult[0]?.count || 0
  const totalPages = Math.ceil(total / perPage)

  return {
    shurtles: userShurtles,
    totalPages,
    currentPage: page,
  }
}

// Increment the hit count and return the URL
const getUrlBySlugPrepared = db
  .update(shurtles)
  .set({ hits: sql`${shurtles.hits} + 1` })
  .where(eq(shurtles.slug, sql.placeholder('slug')))
  .returning({url: shurtles.url})
  .prepare('getUrlBySlug')

export async function getUrlBySlug(slug: string) {
  const shurtle = await getUrlBySlugPrepared.execute({ slug: slug })

  if (shurtle.length === 0) {
    return null
  }

  return shurtle[0].url
}
