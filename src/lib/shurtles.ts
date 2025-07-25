import { db } from "@/db"
import { shurtleHits, shurtles } from "@/db/schema"
import { Geo } from "@vercel/functions"
import { count, eq, sql, sum } from "drizzle-orm"
import { logger } from "./logger"

const userStatsPrepared = db.select({
  totalHits: sum(shurtles.hits),
  totalShurtles: count(),
}).from(shurtles).where(eq(shurtles.userId, sql.placeholder('userId'))).prepare('userStats')


export async function getStats(userId: string) {
  logger.debug(`Fetching stats for user: ${userId}`);

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

    logger.debug(`User ${userId} stats: ${stats.totalShurtles} shurtles, ${stats.totalHits} total hits`);
    return stats;
  } catch (error) {
    logger.error(`Error fetching stats for user ${userId}:`, error);
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
  logger.debug(`Fetching paginated shurtles for user ${userId}, page ${page}, perPage ${perPage}`);

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

    logger.debug(`Found ${paginatedUserShurtles.length} shurtles for user ${userId}, total: ${totalUserShurtles}, pages: ${totalPages}`);

    return {
      shurtles: paginatedUserShurtles,
      totalPages,
      currentPage: page,
    }
  } catch (error) {
    logger.error(`Error fetching paginated shurtles for user ${userId}:`, error);
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
  logger.debug(`Looking up URL for slug: ${slug}`)
  const shurtle = await getUrlBySlugPrepared.execute({ slug: slug })

  if (shurtle?.url) {
    logger.debug(`Slug ${slug} resolved to ${shurtle.url}`)
  } else {
    logger.debug(`No valid URL found for slug: ${slug}`)
  }

  return shurtle?.url
}

export async function recordHit(slug: string, requestGeo: Geo) {
  const coordinates = requestGeo.latitude && requestGeo.longitude
    ? { x: new Number(requestGeo.longitude).valueOf(), y: new Number(requestGeo.latitude).valueOf() }
    : null

  logger.debug(`Recording hit for slug: ${slug} from location: ${requestGeo.city || 'unknown'}, ${requestGeo.country || 'unknown'}`)

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

    logger.debug(`Successfully recorded hit for slug: ${slug}`)
  } catch (error) {
    logger.error(`Failed to record hit for slug: ${slug}`, error)
    // Don't rethrow, as this is a background process
  }
}
