"use server";

import { createShurtleSchema } from "@/lib/schemas";
import { updateTag } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { requireUserId } from "./auth";
import { urlHost } from "./log-serializers";
import { logger } from "./logger";
import {
  deleteOwnShurtle,
  insertShurtle,
  setOwnShurtleExpiry,
} from "./mutations";
import { rateLimits } from "./ratelimits";
import { shurtlesTag, statsTag } from "./tags";

/*
 * Thin Server Actions: authenticate, validate, rate limit, delegate the write to the Data Access
 * Layer (mutations.ts, which re-checks the user and scopes every statement to them), then
 * invalidate the user's cached dashboard data.
 */

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
    const { success: withinLimit, pending } =
      await rateLimits.createShurtle.limiter.limit(userId);
    // Rate limit analytics are sent in the background; keep the function alive until they're done.
    after(() => pending);
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

  try {
    const result = await insertShurtle(parsed.data);

    switch (result.status) {
      case "url-taken":
        logger.debug(
          { userId, slug: result.slug },
          "create shurtle rejected: url already shortened",
        );
        return fail({
          url: [`You already shortened this URL as /${result.slug}.`],
        });
      case "slug-taken":
        logger.debug(
          { userId, slug: customSlug },
          "create shurtle rejected: slug taken",
        );
        return fail({
          slug: ["That slug is already taken. Please choose another one."],
        });
      case "slug-renewable":
        logger.debug(
          { userId, slug: customSlug },
          "create shurtle rejected: slug held by the user's renewable link",
        );
        return fail({
          slug: [
            `/${customSlug} is your link that expired recently. Renew it from your links to keep its clicks.`,
          ],
        });
      case "no-free-slug":
        // 7 characters from 56 symbols: repeated collisions mean something else is wrong.
        logger.warn(
          { userId, attempts: result.attempts },
          "could not generate a free slug",
        );
        return fail({
          form: ["We couldn't generate a free slug. Please try again."],
        });
    }

    logger.info(
      {
        userId,
        slug: result.slug,
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
      data: { slug: result.slug, url, expiresAt: expiresAt ?? null },
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

/** Client-supplied link ids: only accept a UUID. */
const linkIdSchema = z.uuid();

export async function deleteShurtle(id: string): Promise<DeleteShurtleResult> {
  const userId = await requireUserId();

  if (!linkIdSchema.safeParse(id).success) {
    // The UI never sends this, so the action was called directly. Log the shape, not the value.
    logger.warn({ userId, type: typeof id }, "delete shurtle rejected: bad id");
    return { ok: false, error: "Invalid shurtle." };
  }

  try {
    if (!(await deleteOwnShurtle(id))) {
      // Already deleted (e.g. in another tab) or not this user's link.
      logger.info({ userId, id }, "delete shurtle found nothing to delete");
      return { ok: false, error: "This shurtle no longer exists." };
    }

    logger.info({ userId, id }, "shurtle deleted");
    updateTag(shurtlesTag(userId));
    updateTag(statsTag(userId));
    return { ok: true };
  } catch (error) {
    logger.error({ err: error, userId, id }, "failed to delete shurtle");
    return {
      ok: false,
      error:
        "Something went wrong while deleting your shurtle. Please try again.",
    };
  }
}

export type SetShurtleExpiryResult =
  | { ok: true; slug: string; expiresAt: string | null }
  | { ok: false; error: string };

/**
 * Gives a link a new expiry: extends a live link, or renews one that expired less than 24 hours
 * ago (same slug, same click history). `expiresAt` is an ISO timestamp, or "" for never.
 */
export async function setShurtleExpiry(
  id: string,
  expiresAt: string,
): Promise<SetShurtleExpiryResult> {
  const userId = await requireUserId();

  const parsedId = linkIdSchema.safeParse(id);
  const parsedExpiry = createShurtleSchema.shape.expiresAt.safeParse(expiresAt);
  if (!parsedId.success) {
    logger.warn({ userId, type: typeof id }, "set expiry rejected: bad id");
    return { ok: false, error: "Invalid shurtle." };
  }
  if (!parsedExpiry.success) {
    return {
      ok: false,
      error:
        parsedExpiry.error.issues[0]?.message ?? "Pick a valid expiration.",
    };
  }

  const expiry = parsedExpiry.data ?? null;
  try {
    const result = await setOwnShurtleExpiry(
      id,
      expiry ? new Date(expiry) : null,
    );
    switch (result.status) {
      case "not-found":
        logger.info({ userId, id }, "set expiry found no such shurtle");
        return { ok: false, error: "This shurtle no longer exists." };
      case "released":
        logger.info({ userId, id }, "set expiry rejected: slug released");
        return {
          ok: false,
          error:
            "Its 24 hours to renew are over, so the slug is free for anyone to claim again.",
        };
    }

    logger.info(
      { userId, id, slug: result.slug, expiresAt: expiry },
      "shurtle expiry set",
    );
    updateTag(shurtlesTag(userId));
    updateTag(statsTag(userId));
    return { ok: true, slug: result.slug, expiresAt: expiry };
  } catch (error) {
    logger.error({ err: error, userId, id }, "failed to set shurtle expiry");
    return {
      ok: false,
      error: "Something went wrong while saving. Please try again.",
    };
  }
}
