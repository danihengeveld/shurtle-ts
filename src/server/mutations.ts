import "server-only";

import type { createShurtleSchema } from "@/lib/schemas";
import { GENERATED_SLUG_LENGTH, isReservedSlug } from "@/lib/slugs";
import { db } from "@/server/db";
import { shurtles } from "@/server/db/schema";
import { and, eq, isNull, lte, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import type { z } from "zod";
import { requireUserId } from "./auth";
import { logger } from "./logger";
import { isExpired } from "./queries";

/*
 * Data Access Layer for writes. User-facing mutations resolve the signed-in user themselves and
 * scope every statement to them, so the Server Actions in actions.ts stay thin: validation, rate
 * limiting, user-facing messages and cache invalidation.
 */

// Unambiguous alphabet (no 0/O, 1/l/I) so generated links are easy to read aloud and retype.
const randomSlug = customAlphabet(
  "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ",
  GENERATED_SLUG_LENGTH,
);

/** A random slug that is never a reserved path (the alphabet can spell e.g. `sitemap` or `expired`). */
function generateSlug() {
  let slug = randomSlug();
  while (isReservedSlug(slug)) slug = randomSlug();
  return slug;
}
const MAX_GENERATE_ATTEMPTS = 3;

export type InsertShurtleResult =
  | { status: "created"; slug: string }
  /** The user already has a live link for this URL. */
  | { status: "url-taken"; slug: string }
  /** The requested custom slug belongs to another link. */
  | { status: "slug-taken" }
  /** Every generated slug collided: something else is wrong. */
  | { status: "no-free-slug"; attempts: number };

/** Creates a short link for the signed-in user. Expects validated input; throws on database errors. */
export async function insertShurtle({
  url,
  slug: customSlug,
  expiresAt,
}: z.output<typeof createShurtleSchema>): Promise<InsertShurtleResult> {
  const userId = await requireUserId();

  /** This user's unarchived link for the URL, if any (the scope of the partial unique index). */
  const findLiveLink = async () => {
    const [existing] = await db
      .select({ slug: shurtles.slug, expired: isExpired })
      .from(shurtles)
      .where(
        and(
          eq(shurtles.userId, userId),
          eq(shurtles.url, url),
          isNull(shurtles.archivedAt),
        ),
      )
      .limit(1);
    return existing;
  };

  // Fast path for the common case; the unique (user_id, url) index below is what guarantees it.
  const live = await findLiveLink();
  if (live && !live.expired) return { status: "url-taken", slug: live.slug };
  if (live) {
    // Expired but not archived by the daily cron yet: archive it now so the URL can be reused.
    await db
      .update(shurtles)
      .set({ archivedAt: sql`now()` })
      .where(and(eq(shurtles.slug, live.slug), isNull(shurtles.archivedAt)));
    logger.info(
      { userId, slug: live.slug },
      "archived expired shurtle to reuse its url",
    );
  }

  // Insert-or-skip: no read-then-write race. Without a target, a clash on either unique key (the
  // slug, or this user + URL) skips the insert instead of throwing. Generated slugs are retried on
  // the (unlikely) event of a collision; a taken custom slug is reported back to the user.
  const attempts = customSlug ? 1 : MAX_GENERATE_ATTEMPTS;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const [inserted] = await db
      .insert(shurtles)
      .values({
        slug: customSlug ?? generateSlug(),
        url,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId,
      })
      .onConflictDoNothing()
      .returning({ slug: shurtles.slug });

    if (inserted) return { status: "created", slug: inserted.slug };

    // A concurrent request created the same URL first: report it rather than retrying.
    const raced = await findLiveLink();
    if (raced) {
      logger.info(
        { userId, slug: raced.slug },
        "concurrent create of the same url caught by unique index",
      );
      return { status: "url-taken", slug: raced.slug };
    }
  }

  return customSlug
    ? { status: "slug-taken" }
    : { status: "no-free-slug", attempts };
}

/**
 * Deletes one of the signed-in user's links. Returns false when there was nothing to delete (already
 * deleted, or not this user's link). Throws on database errors.
 */
export async function deleteOwnShurtle(slug: string) {
  const userId = await requireUserId();
  const deleted = await db
    .delete(shurtles)
    .where(and(eq(shurtles.slug, slug), eq(shurtles.userId, userId)))
    .returning({ slug: shurtles.slug });
  return deleted.length > 0;
}

/**
 * Marks every expired, unarchived link as archived (kept with its click history, URL freed for
 * reuse) and returns their owners. A system task with no signed-in user: callers must authorize
 * the request themselves (the cron route checks its bearer secret).
 */
export async function archiveExpiredShurtles() {
  const archived = await db
    .update(shurtles)
    .set({ archivedAt: sql`now()` })
    .where(
      and(isNull(shurtles.archivedAt), lte(shurtles.expiresAt, sql`now()`)),
    )
    .returning({ userId: shurtles.userId });
  return archived.map((row) => row.userId);
}
