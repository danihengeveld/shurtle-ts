"use server";

import { db } from "@/server/db";
import { shurtles } from "@/server/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { updateTag } from "next/cache";
import { z } from "zod";
import { requireUserId } from "./auth";
import { urlHost } from "./log-serializers";
import { logger } from "./logger";
import { rateLimits } from "./ratelimits";
import { createShurtleSchema } from "@/lib/schemas";
import { isExpired } from "./queries";
import {
  GENERATED_SLUG_LENGTH,
  SLUG_PATTERN,
  isReservedSlug,
} from "@/lib/slugs";
import { shurtlesTag, statsTag } from "./tags";

export type CreateShurtleFieldErrors = {
  url?: string[];
  slug?: string[];
  expiresAt?: string[];
  /** Errors not tied to a single field (rate limiting, server errors). */
  form?: string[];
};

export type CreateShurtleFormState =
  | { status: "idle" }
  | {
      status: "error";
      errors: CreateShurtleFieldErrors;
      /** The submitted values, so the form can be re-populated after a failed submit. */
      fields: { url: string; slug: string; expiresAt: string };
    }
  | {
      status: "success";
      data: { slug: string; url: string; expiresAt: string | null };
    };

export type DeleteShurtleResult = { ok: true } | { ok: false; error: string };

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

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createShurtle(
  _previousState: CreateShurtleFormState,
  formData: FormData,
): Promise<CreateShurtleFormState> {
  const userId = await requireUserId();

  const fields = {
    url: formValue(formData, "url"),
    slug: formValue(formData, "slug"),
    expiresAt: formValue(formData, "expiresAt"),
  };
  const fail = (errors: CreateShurtleFieldErrors): CreateShurtleFormState => ({
    status: "error",
    errors,
    fields,
  });

  const parsed = createShurtleSchema.safeParse(fields);
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;
    // Field names only: the submitted values may contain tokens or personal data.
    logger.debug(
      { userId, invalid: Object.keys(fieldErrors) },
      "create shurtle rejected by validation",
    );
    return fail(fieldErrors);
  }

  try {
    const { success: withinLimit } =
      await rateLimits.createShurtle.limiter.limit(userId);
    if (!withinLimit) {
      logger.warn({ userId }, "rate limit exceeded creating shurtle");
      return fail({ form: [rateLimits.createShurtle.limitMessage] });
    }
  } catch (error) {
    // Fail open, like the proxy: a rate limiter outage must not block creating links.
    logger.error(
      { err: error, userId },
      "rate limiter unavailable, failing open",
    );
  }

  const { url, slug: customSlug, expiresAt } = parsed.data;
  const host = urlHost(url);

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
  const alreadyShortened = (slug: string) =>
    fail({ url: [`You already shortened this URL as /${slug}.`] });

  try {
    // Fast path for the common case; the unique (user_id, url) index below is what guarantees it.
    const live = await findLiveLink();
    if (live && !live.expired) {
      logger.debug(
        { userId, slug: live.slug },
        "create shurtle rejected: url already shortened",
      );
      return alreadyShortened(live.slug);
    }
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
    let createdSlug: string | undefined;

    for (let attempt = 0; attempt < attempts && !createdSlug; attempt++) {
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

      createdSlug = inserted?.slug;

      if (!createdSlug) {
        // A concurrent request created the same URL first: report it rather than retrying.
        const raced = await findLiveLink();
        if (raced) {
          logger.info(
            { userId, slug: raced.slug },
            "concurrent create of the same url caught by unique index",
          );
          return alreadyShortened(raced.slug);
        }
      }
    }

    if (!createdSlug) {
      if (customSlug) {
        logger.debug(
          { userId, slug: customSlug },
          "create shurtle rejected: slug taken",
        );
        return fail({
          slug: ["That slug is already taken. Please choose another one."],
        });
      }
      // 7 characters from 56 symbols: three collisions in a row means something else is wrong.
      logger.warn({ userId, attempts }, "could not generate a free slug");
      return fail({
        form: ["We couldn't generate a free slug. Please try again."],
      });
    }

    logger.info(
      {
        userId,
        slug: createdSlug,
        host,
        customSlug: Boolean(customSlug),
        expiresAt: expiresAt ?? null,
      },
      "shurtle created",
    );

    // Read-your-writes: expire the cached dashboard data for this user immediately.
    updateTag(shurtlesTag(userId));
    updateTag(statsTag(userId));

    return {
      status: "success",
      data: { slug: createdSlug, url, expiresAt: expiresAt ?? null },
    };
  } catch (error) {
    logger.error({ err: error, userId, host }, "failed to create shurtle");
    return fail({
      form: [
        "Something went wrong while creating your shurtle. Please try again.",
      ],
    });
  }
}

export async function deleteShurtle(
  slug: string,
): Promise<DeleteShurtleResult> {
  const userId = await requireUserId();

  // Client-supplied: only accept the shape a stored slug can have. Deliberately looser than
  // isValidSlug (no reserved words, column-length cap) so links created under older rules can
  // still be deleted.
  if (
    typeof slug !== "string" ||
    slug.length > 255 ||
    !SLUG_PATTERN.test(slug)
  ) {
    // The UI never sends this, so the action was called directly. Log the shape, not the value.
    logger.warn(
      {
        userId,
        type: typeof slug,
        length: typeof slug === "string" ? slug.length : null,
      },
      "delete shurtle rejected: invalid slug",
    );
    return { ok: false, error: "Invalid shurtle." };
  }

  try {
    const deleted = await db
      .delete(shurtles)
      .where(and(eq(shurtles.slug, slug), eq(shurtles.userId, userId)))
      .returning({ slug: shurtles.slug });

    if (deleted.length === 0) {
      // Already deleted (e.g. in another tab) or not this user's link.
      logger.info({ userId, slug }, "delete shurtle found nothing to delete");
      return { ok: false, error: "This shurtle no longer exists." };
    }

    logger.info({ userId, slug }, "shurtle deleted");
    updateTag(shurtlesTag(userId));
    updateTag(statsTag(userId));
    return { ok: true };
  } catch (error) {
    logger.error({ err: error, userId, slug }, "failed to delete shurtle");
    return {
      ok: false,
      error:
        "Something went wrong while deleting your shurtle. Please try again.",
    };
  }
}
