import { db } from "@/db"
import { shurtles } from "@/db/schema"
import { logger } from "@/lib/logger"
import { shurtlesTag, statsTag } from "@/lib/tags"
import { and, isNull, lte, sql } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { timingSafeEqual } from "node:crypto"
import { connection, type NextRequest } from "next/server"

/**
 * Archives expired shurtles: they're kept (with their click history) but marked `archived_at`, which
 * frees their URL for a new link (see the partial unique index). Links already stop redirecting the
 * moment they expire, so this only makes that state permanent; nothing is deleted. Invoked daily by
 * Vercel Cron (see vercel.json), which sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  await connection()

  const secret = process.env.CRON_SECRET
  if (!secret) {
    logger.error("CRON_SECRET is not configured, refusing to archive expired shurtles")
    return Response.json({ error: "Cron is not configured" }, { status: 500 })
  }

  if (!isAuthorized(request.headers.get("authorization"), secret)) {
    logger.warn("unauthorized archive-expired attempt")
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = performance.now()
  try {
    const archived = await db
      .update(shurtles)
      .set({ archivedAt: sql`now()` })
      .where(and(isNull(shurtles.archivedAt), lte(shurtles.expiresAt, sql`now()`)))
      .returning({ userId: shurtles.userId })

    // The dashboard already shows these as expired; refresh cached lists and counts in the background.
    const userIds = new Set(archived.map((row) => row.userId))
    for (const userId of userIds) {
      revalidateTag(shurtlesTag(userId), "max")
      revalidateTag(statsTag(userId), "max")
    }

    const durationMs = Math.round(performance.now() - startedAt)
    logger.info({ archived: archived.length, users: userIds.size, durationMs }, "archived expired shurtles")
    return Response.json({ success: true, archived: archived.length })
  } catch (error) {
    logger.error({ err: error, durationMs: Math.round(performance.now() - startedAt) }, "archiving expired shurtles failed")
    return Response.json({ error: "Archiving failed" }, { status: 500 })
  }
}

function isAuthorized(header: string | null, secret: string) {
  if (!header) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(header)
  return received.length === expected.length && timingSafeEqual(received, expected)
}
