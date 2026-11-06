"use server"

import { db } from "@/db"
import { shurtles } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { customAlphabet } from "nanoid"
import { updateTag } from "next/cache"
import { z } from "zod"
import { requireUserId } from "./auth"
import { rateLimits } from "./ratelimits"
import { createShurtleSchema } from "./schemas"
import { GENERATED_SLUG_LENGTH } from "./slugs"
import { shurtlesTag, statsTag } from "./tags"

export type CreateShurtleFieldErrors = {
  url?: string[]
  slug?: string[]
  expiresAt?: string[]
  /** Errors not tied to a single field (rate limiting, server errors). */
  form?: string[]
}

export type CreateShurtleFormState =
  | { status: "idle" }
  | {
      status: "error"
      errors: CreateShurtleFieldErrors
      /** The submitted values, so the form can be re-populated after a failed submit. */
      fields: { url: string; slug: string; expiresAt: string }
    }
  | {
      status: "success"
      data: { slug: string; url: string; expiresAt: string | null }
    }

export type DeleteShurtleResult = { ok: true } | { ok: false; error: string }

// Unambiguous alphabet (no 0/O, 1/l/I) so generated links are easy to read aloud and retype.
const generateSlug = customAlphabet("23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", GENERATED_SLUG_LENGTH)
const MAX_GENERATE_ATTEMPTS = 3

function formValue(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

export async function createShurtle(
  _previousState: CreateShurtleFormState,
  formData: FormData,
): Promise<CreateShurtleFormState> {
  const userId = await requireUserId()

  const fields = {
    url: formValue(formData, "url"),
    slug: formValue(formData, "slug"),
    expiresAt: formValue(formData, "expiresAt"),
  }
  const fail = (errors: CreateShurtleFieldErrors): CreateShurtleFormState => ({ status: "error", errors, fields })

  const parsed = createShurtleSchema.safeParse(fields)
  if (!parsed.success) {
    return fail(z.flattenError(parsed.error).fieldErrors)
  }

  const { success: withinLimit } = await rateLimits.createShurtle.limiter.limit(userId)
  if (!withinLimit) {
    console.warn(`Rate limit exceeded for user ${userId} when creating a shurtle`)
    return fail({ form: [rateLimits.createShurtle.limitMessage] })
  }

  const { url, slug: customSlug, expiresAt } = parsed.data

  const findExistingSlug = async () => {
    const [existing] = await db
      .select({ slug: shurtles.slug })
      .from(shurtles)
      .where(and(eq(shurtles.userId, userId), eq(shurtles.url, url)))
      .limit(1)
    return existing?.slug
  }
  const alreadyShortened = (slug: string) => fail({ url: [`You already shortened this URL as /${slug}.`] })

  try {
    // Fast path for the common case; the unique (user_id, url) index below is what guarantees it.
    const existingSlug = await findExistingSlug()
    if (existingSlug) return alreadyShortened(existingSlug)

    // Insert-or-skip: no read-then-write race. Without a target, a clash on either unique key (the
    // slug, or this user + URL) skips the insert instead of throwing. Generated slugs are retried on
    // the (unlikely) event of a collision; a taken custom slug is reported back to the user.
    const attempts = customSlug ? 1 : MAX_GENERATE_ATTEMPTS
    let createdSlug: string | undefined

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
        .returning({ slug: shurtles.slug })

      createdSlug = inserted?.slug

      if (!createdSlug) {
        // A concurrent request created the same URL first: report it rather than retrying.
        const racedSlug = await findExistingSlug()
        if (racedSlug) return alreadyShortened(racedSlug)
      }
    }

    if (!createdSlug) {
      return customSlug
        ? fail({ slug: ["That slug is already taken. Please choose another one."] })
        : fail({ form: ["We couldn't generate a free slug. Please try again."] })
    }

    console.info(`User ${userId} created shurtle /${createdSlug}`)

    // Read-your-writes: expire the cached dashboard data for this user immediately.
    updateTag(shurtlesTag(userId))
    updateTag(statsTag(userId))

    return { status: "success", data: { slug: createdSlug, url, expiresAt: expiresAt ?? null } }
  } catch (error) {
    console.error(`Error creating shurtle for user ${userId}:`, error)
    return fail({ form: ["Something went wrong while creating your shurtle. Please try again."] })
  }
}

export async function deleteShurtle(slug: string): Promise<DeleteShurtleResult> {
  const userId = await requireUserId()

  if (typeof slug !== "string" || slug.length === 0) {
    return { ok: false, error: "Invalid shurtle." }
  }

  try {
    const deleted = await db
      .delete(shurtles)
      .where(and(eq(shurtles.slug, slug), eq(shurtles.userId, userId)))
      .returning({ slug: shurtles.slug })

    if (deleted.length === 0) {
      return { ok: false, error: "This shurtle no longer exists." }
    }

    console.info(`User ${userId} deleted shurtle /${slug}`)
    updateTag(shurtlesTag(userId))
    updateTag(statsTag(userId))
    return { ok: true }
  } catch (error) {
    console.error(`Error deleting shurtle /${slug} for user ${userId}:`, error)
    return { ok: false, error: "Something went wrong while deleting your shurtle. Please try again." }
  }
}
