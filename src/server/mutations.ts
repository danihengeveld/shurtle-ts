import "server-only";

import type { createShurtleSchema } from "@/lib/schemas";
import { GENERATED_SLUG_LENGTH, isReservedSlug } from "@/lib/slugs";
import { db } from "@/server/db";
import { shurtles } from "@/server/db/schema";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import type { z } from "zod";
import { requireUserId } from "./auth";
import { logger } from "./logger";
import { holdsSlug, isExpired, isReleaseDue, isRenewable } from "./queries";

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

/**
 * Marks the link holding `slug` released if its renewal window is over, so the slug can be claimed
 * right away instead of after the next daily cron run.
 */
async function releaseSlugIfDue(slug: string) {
  await db
    .update(shurtles)
    .set({ archivedAt: sql`now()` })
    .where(and(eq(shurtles.slug, slug), isReleaseDue));
}

export type InsertShurtleResult =
  | { status: "created"; slug: string }
  /** The user already has a live link for this URL. */
  | { status: "url-taken"; slug: string }
  /** The requested custom slug belongs to another link. */
  | { status: "slug-taken" }
  /** The requested custom slug is the user's own recently expired link: renew that instead. */
  | { status: "slug-renewable" }
  /** Every generated slug collided: something else is wrong. */
  | { status: "no-free-slug"; attempts: number };

/** Creates a short link for the signed-in user. Expects validated input; throws on database errors. */
export async function insertShurtle({
  url,
  slug: customSlug,
  expiresAt,
}: z.output<typeof createShurtleSchema>): Promise<InsertShurtleResult> {
  const userId = await requireUserId();

  /** This user's unreleased link for the URL, if any (the scope of the partial unique index). */
  const findLiveLink = async () => {
    const [existing] = await db
      .select({ id: shurtles.id, slug: shurtles.slug, expired: isExpired })
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
    // Expired: shortening the URL again replaces that link, so release it (and its slug) now.
    await db
      .update(shurtles)
      .set({ archivedAt: sql`now()` })
      .where(and(eq(shurtles.id, live.id), isNull(shurtles.archivedAt)));
    logger.info(
      { userId, slug: live.slug },
      "released expired shurtle to reuse its url",
    );
  }

  // Insert-or-skip: no read-then-write race. Without a target, a clash on any unique index (the
  // slug of an unreleased link, or this user + URL) skips the insert instead of throwing. Generated
  // slugs are retried on the (unlikely) event of a collision; a taken custom slug is reported.
  const attempts = customSlug ? 1 : MAX_GENERATE_ATTEMPTS;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const slug = customSlug ?? generateSlug();
    await releaseSlugIfDue(slug);

    const [inserted] = await db
      .insert(shurtles)
      .values({
        slug,
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

  if (!customSlug) return { status: "no-free-slug", attempts };

  const [holder] = await db
    .select({ userId: shurtles.userId, renewable: isRenewable })
    .from(shurtles)
    .where(and(eq(shurtles.slug, customSlug), isNull(shurtles.archivedAt)))
    .limit(1);
  return holder?.userId === userId && holder.renewable
    ? { status: "slug-renewable" }
    : { status: "slug-taken" };
}

/**
 * Deletes one of the signed-in user's links. Returns false when there was nothing to delete (already
 * deleted, or not this user's link). Throws on database errors.
 */
export async function deleteOwnShurtle(id: string) {
  const userId = await requireUserId();
  const deleted = await db
    .delete(shurtles)
    .where(and(eq(shurtles.id, id), eq(shurtles.userId, userId)))
    .returning({ id: shurtles.id });
  return deleted.length > 0;
}

export type SetExpiryResult =
  | { status: "updated"; slug: string }
  /** No such link for this user (deleted, or someone else's). */
  | { status: "not-found" }
  /** Its renewal window is over: the slug may already belong to someone else. */
  | { status: "released" };

/**
 * Gives one of the signed-in user's links a new expiry (or none): extends a live link, or renews
 * a renewable one, which keeps its slug and click history. Expects a validated future moment.
 */
export async function setOwnShurtleExpiry(
  id: string,
  expiresAt: Date | null,
): Promise<SetExpiryResult> {
  const userId = await requireUserId();

  // `holdsSlug` makes this safe against a concurrent claim: a link whose window is over is either
  // released already or released by the claim before it inserts, and then this matches nothing.
  const [updated] = await db
    .update(shurtles)
    .set({ expiresAt })
    .where(and(eq(shurtles.id, id), eq(shurtles.userId, userId), holdsSlug))
    .returning({ slug: shurtles.slug });
  if (updated) return { status: "updated", slug: updated.slug };

  const [existing] = await db
    .select({ id: shurtles.id })
    .from(shurtles)
    .where(and(eq(shurtles.id, id), eq(shurtles.userId, userId)));
  return existing ? { status: "released" } : { status: "not-found" };
}

export type SetUrlResult =
  | { status: "updated"; slug: string; url: string }
  /** No such link for this user (deleted, or someone else's). */
  | { status: "not-found" }
  /** Its renewal window is over: the slug may already belong to someone else. */
  | { status: "released" }
  /** Another of the user's unreleased links already goes to this URL. */
  | { status: "url-taken"; slug: string };

/** Postgres' unique_violation on `constraint`; drizzle wraps driver errors in `cause`. */
function isUniqueViolation(error: unknown, constraint: string) {
  for (
    let e = error;
    e instanceof Object;
    e = (e as { cause?: unknown }).cause
  ) {
    const { code, constraint: name } = e as {
      code?: unknown;
      constraint?: unknown;
    };
    if (code === "23505" && name === constraint) return true;
  }
  return false;
}

/**
 * Points one of the signed-in user's links somewhere else, keeping its slug and click history. Only
 * a link that still holds its slug (live, or renewable) can be changed. Expects a validated,
 * normalized URL (see `createShurtleSchema`); throws on database errors.
 */
export async function setOwnShurtleUrl(
  id: string,
  url: string,
): Promise<SetUrlResult> {
  const userId = await requireUserId();

  /** The user's other unreleased link for the URL (the scope of the unique (user_id, url) index). */
  const findOtherLink = async () => {
    const [other] = await db
      .select({ slug: shurtles.slug })
      .from(shurtles)
      .where(
        and(
          eq(shurtles.userId, userId),
          eq(shurtles.url, url),
          isNull(shurtles.archivedAt),
          ne(shurtles.id, id),
        ),
      )
      .limit(1);
    return other;
  };

  // Fast path; the unique index is what guarantees it against a concurrent create or edit.
  const other = await findOtherLink();
  if (other) return { status: "url-taken", slug: other.slug };

  let updated: { slug: string; url: string } | undefined;
  try {
    // `holdsSlug`, as for a new expiry: a released link's slug may already be someone else's.
    [updated] = await db
      .update(shurtles)
      .set({ url })
      .where(and(eq(shurtles.id, id), eq(shurtles.userId, userId), holdsSlug))
      .returning({ slug: shurtles.slug, url: shurtles.url });
  } catch (error) {
    if (!isUniqueViolation(error, "user_id_url_idx")) throw error;
    const raced = await findOtherLink();
    // Gone again already (deleted or released in between): rare enough to let the user retry.
    if (!raced) throw error;
    logger.info(
      { userId, slug: raced.slug },
      "concurrent use of the same url caught by unique index",
    );
    return { status: "url-taken", slug: raced.slug };
  }
  if (updated) return { status: "updated", ...updated };

  const [existing] = await db
    .select({ id: shurtles.id })
    .from(shurtles)
    .where(and(eq(shurtles.id, id), eq(shurtles.userId, userId)));
  return existing ? { status: "released" } : { status: "not-found" };
}

/**
 * Marks every link whose renewal window is over as released (kept with its click history; slug and
 * URL free for reuse) and returns their owners. A system task with no signed-in user: callers must
 * authorize the request themselves (the cron route checks its bearer secret).
 */
export async function releaseExpiredShurtles() {
  const released = await db
    .update(shurtles)
    .set({ archivedAt: sql`now()` })
    .where(isReleaseDue)
    .returning({ userId: shurtles.userId });
  return released.map((row) => row.userId);
}
