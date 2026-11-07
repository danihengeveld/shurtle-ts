import { logger } from "@/server/logger";
import { releaseExpiredShurtles } from "@/server/mutations";
import { shurtlesTag, statsTag } from "@/server/tags";
import { revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { connection, type NextRequest } from "next/server";

/**
 * Releases expired shurtles whose 24 hours to renew are over: they're kept (with their click history)
 * but marked `archived_at`, which frees their slug and URL for new links (see the partial unique
 * indexes). Links stop redirecting the moment they expire, and a slug can already be claimed once
 * its window is over (the claim releases it), so this only catches up; nothing is deleted. Invoked
 * daily by Vercel Cron (see vercel.json), which sends `Authorization: Bearer $CRON_SECRET`. The path
 * keeps its old name so existing cron configurations keep working.
 */
export async function GET(request: NextRequest) {
  await connection();

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error(
      "CRON_SECRET is not configured, refusing to release expired shurtles",
    );
    return Response.json({ error: "Cron is not configured" }, { status: 500 });
  }

  if (!isAuthorized(request.headers.get("authorization"), secret)) {
    logger.warn("unauthorized archive-expired attempt");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = performance.now();
  try {
    const released = await releaseExpiredShurtles();

    // The dashboard already shows these as released; refresh cached lists and counts in the background.
    const userIds = new Set(released);
    for (const userId of userIds) {
      revalidateTag(shurtlesTag(userId), "max");
      revalidateTag(statsTag(userId), "max");
    }

    const durationMs = Math.round(performance.now() - startedAt);
    logger.info(
      { released: released.length, users: userIds.size, durationMs },
      "released expired shurtles",
    );
    return Response.json({ success: true, released: released.length });
  } catch (error) {
    logger.error(
      { err: error, durationMs: Math.round(performance.now() - startedAt) },
      "releasing expired shurtles failed",
    );
    return Response.json({ error: "Releasing failed" }, { status: 500 });
  }
}

function isAuthorized(header: string | null, secret: string) {
  if (!header) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}
