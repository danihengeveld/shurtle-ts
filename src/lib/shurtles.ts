import { db } from "@/db"
import { shurtleHits, shurtles } from "@/db/schema"
import { Geo } from "@vercel/functions"
import { count, eq, sql, sum } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

const userStatsPrepared = db.select({
  totalHits: sum(shurtles.hits),
  totalShurtles: count(),
}).from(shurtles).where(eq(shurtles.userId, sql.placeholder('userId'))).prepare('userStats')


export async function getStats(userId: string) {
  "use cache"
  cacheTag(`user:${userId}/stats`)
  cacheLife("minutes")

  console.debug(`Fetching stats for user: ${userId}`);

  try {
    const userStats = await userStatsPrepared.execute({
      userId: userId
    });

    const stats = {
      totalHits: userStats[0]?.totalHits ? parseInt(userStats[0].totalHits) : 0,
      totalShurtles: userStats[0]?.totalShurtles || 0,
    }

    // Ensure totalHits is not null
    stats.totalHits = stats.totalHits || 0

    console.debug(`User ${userId} stats: ${stats.totalShurtles} shurtles, ${stats.totalHits} total hits`);
    return stats;
  } catch (error) {
    console.error(`Error fetching stats for user ${userId}:`, error);
    // Return default stats on error
    return {
      totalHits: 0,
      totalShurtles: 0
    };
  }
}

const paginatedUserShurtlesPrepared = db.query.shurtles.findMany({
  where: (shurtles, { eq }) => eq(shurtles.userId, sql.placeholder('userId')),
  orderBy: (shurtles, { desc }) => desc(shurtles.createdAt),
  limit: sql.placeholder('perPage'),
  offset: sql.placeholder('offset'),
}).prepare('paginatedUserShurtles')

export async function getShurtlesPaginated(userId: string, page = 1, perPage = 10) {
  "use cache"
  cacheTag(`user:${userId}/shurtles`)
  cacheLife("minutes")

  console.debug(`Fetching paginated shurtles for user ${userId}, page ${page}, perPage ${perPage}`);

  try {
    // Calculate offset
    const offset = (page - 1) * perPage

    const paginatedUserShurtles = await paginatedUserShurtlesPrepared.execute({
      userId: userId,
      perPage: perPage,
      offset: offset,
    });

    const totalUserShurtles = await db.$count(shurtles, eq(shurtles.userId, userId));
    const totalPages = Math.ceil(totalUserShurtles / perPage)

    console.debug(`Found ${paginatedUserShurtles.length} shurtles for user ${userId}, total: ${totalUserShurtles}, pages: ${totalPages}`);

    return {
      shurtles: paginatedUserShurtles,
      totalPages,
      currentPage: page,
    }
  } catch (error) {
    console.error(`Error fetching paginated shurtles for user ${userId}:`, error);
    throw error; // Re-throw as this is a critical operation that should fail visibly
  }
}

const getUrlBySlugPrepared = db.query.shurtles.findFirst({
  where: (shurtles, { eq, and, gt, or, isNull }) => and(
    eq(shurtles.slug, sql.placeholder('slug')),
    or(
      isNull(shurtles.expiresAt),
      gt(shurtles.expiresAt, sql`NOW()`)
    )
  ),
  columns: {
    url: true
  }
}).prepare('getUrlBySlug')

export async function getUrlBySlug(slug: string) {
  console.debug(`Looking up URL for slug: ${slug}`)
  const shurtle = await getUrlBySlugPrepared.execute({ slug: slug })

  if (shurtle?.url) {
    console.debug(`Slug ${slug} resolved to ${shurtle.url}`)
  } else {
    console.debug(`No valid URL found for slug: ${slug}`)
  }

  return shurtle?.url
}

// Get shurtle with owner validation
const getShurtleWithOwnerPrepared = db.query.shurtles.findFirst({
  where: (shurtles, { eq, and }) => and(
    eq(shurtles.slug, sql.placeholder('slug')),
    eq(shurtles.userId, sql.placeholder('userId'))
  ),
  with: {
    hits: {
      orderBy: (hits, { desc }) => desc(hits.at),
      limit: 50 // Get recent hits for the table
    }
  }
}).prepare('getShurtleWithOwner')

export async function getShurtleDetails(slug: string, userId: string) {
  logger.debug(`Fetching shurtle details for slug: ${slug}, user: ${userId}`)
  
  try {
    const shurtle = await getShurtleWithOwnerPrepared.execute({ slug, userId })
    
    if (!shurtle) {
      logger.debug(`Shurtle not found or user not authorized: ${slug}`)
      return null
    }
    
    logger.debug(`Found shurtle details for ${slug}: ${shurtle.hits.length} hits`)
    return shurtle
  } catch (error) {
    logger.error(`Error fetching shurtle details for ${slug}:`, error)
    throw error
  }
}

// Get hit analytics over time for a shurtle
const getShurtleHitsAnalyticsPrepared = db.select({
  date: sql<string>`DATE(${shurtleHits.at})`,
  hits: count(),
}).from(shurtleHits)
.where(eq(shurtleHits.slug, sql.placeholder('slug')))
.groupBy(sql`DATE(${shurtleHits.at})`)
.orderBy(sql`DATE(${shurtleHits.at})`)
.prepare('getShurtleHitsAnalytics')

export async function getShurtleAnalytics(slug: string) {
  logger.debug(`Fetching analytics for slug: ${slug}`)
  
  try {
    const analytics = await getShurtleHitsAnalyticsPrepared.execute({ slug })
    logger.debug(`Found ${analytics.length} days of analytics for ${slug}`)
    return analytics
  } catch (error) {
    logger.error(`Error fetching analytics for ${slug}:`, error)
    return []
  }
}

// Get geographic distribution of hits
const getShurtleGeoAnalyticsPrepared = db.select({
  country: shurtleHits.country,
  region: shurtleHits.region,
  city: shurtleHits.city,
  hits: count(),
}).from(shurtleHits)
.where(eq(shurtleHits.slug, sql.placeholder('slug')))
.groupBy(shurtleHits.country, shurtleHits.region, shurtleHits.city)
.orderBy(sql`count(*) DESC`)
.limit(20)
.prepare('getShurtleGeoAnalytics')

export async function getShurtleGeoAnalytics(slug: string) {
  logger.debug(`Fetching geo analytics for slug: ${slug}`)
  
  try {
    const geoAnalytics = await getShurtleGeoAnalyticsPrepared.execute({ slug })
    logger.debug(`Found geo analytics for ${geoAnalytics.length} locations for ${slug}`)
    return geoAnalytics
  } catch (error) {
    logger.error(`Error fetching geo analytics for ${slug}:`, error)
    return []
  }
}

export async function recordHit(slug: string, requestGeo: Geo) {
  const coordinates = requestGeo.latitude && requestGeo.longitude
    ? { x: new Number(requestGeo.longitude).valueOf(), y: new Number(requestGeo.latitude).valueOf() }
    : null

  console.debug(`Recording hit for slug: ${slug} from location: ${requestGeo.city || 'unknown'}, ${requestGeo.country || 'unknown'}`)

  try {
    await db.transaction(async (tx) => {
      // Insert the hit record
      await tx.insert(shurtleHits).values({
        slug: slug,
        country: requestGeo.country,
        region: requestGeo.countryRegion,
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
    })

    console.debug(`Successfully recorded hit for slug: ${slug}`)
  } catch (error) {
    console.error(`Failed to record hit for slug: ${slug}`, error)
    // Don't rethrow, as this is a background process
  }
}
