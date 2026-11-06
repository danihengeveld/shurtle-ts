import { db } from "@/db"
import { shurtles } from "@/db/schema"
import { shurtlesTag, statsTag } from "@/lib/tags"
import { lt, sql } from "drizzle-orm"
import { revalidateTag } from "next/cache"
import { timingSafeEqual } from "node:crypto"
import { connection, type NextRequest } from "next/server"

/**
 * Deletes expired shurtles (and, via cascade, their hits). Invoked weekly by Vercel Cron
 * (see vercel.json), which sends `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  await connection()

  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error("CRON_SECRET is not configured; refusing to run cleanup")
    return Response.json({ error: "Cron is not configured" }, { status: 500 })
  }

  if (!isAuthorized(request.headers.get("authorization"), secret)) {
    console.warn("Unauthorized cleanup attempt")
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const deleted = await db
      .delete(shurtles)
      .where(lt(shurtles.expiresAt, sql`now()`))
      .returning({ userId: shurtles.userId })

    for (const userId of new Set(deleted.map((row) => row.userId))) {
      revalidateTag(shurtlesTag(userId), "max")
      revalidateTag(statsTag(userId), "max")
    }

    console.info(`Cleanup completed: ${deleted.length} expired shurtles deleted`)
    return Response.json({ success: true, deleted: deleted.length })
  } catch (error) {
    console.error("Error during cleanup:", error)
    return Response.json({ error: "Cleanup failed" }, { status: 500 })
  }
}

function isAuthorized(header: string | null, secret: string) {
  if (!header) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(header)
  return received.length === expected.length && timingSafeEqual(received, expected)
}
