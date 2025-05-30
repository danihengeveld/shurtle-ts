"use server"

import { db } from "@/db"
import { shurtles } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod/v4"
import { rateLimits } from "./ratelimits"

// Reserved slugs that should not be used
// These paths are reserved for internal use and should not be used as slugs by users
const reservedSlugs = ['dashboard', 'shurtle', 'api', '_next', 'sign-in', 'sign-up']

// Reserved URLs that should not be used
const reservedUrls = ['localhost', 'shurtle.app', 'www.shurtle.app']

// Schema for create shurtle validation
const createShurtleSchema = z.object({
  slug: z
    .string()
    .trim()
    .nullable()
    .transform((val) => (val === "" ? null : val)) // Transform empty string to null
    .refine(
      (val) => val === null || /^[a-zA-Z0-9_-]+$/.test(val),
      "Slug can only contain letters, numbers, underscores, and hyphens"
    )
    .refine(
      (val) => val === null || !reservedSlugs.includes(val),
      "Slug is reserved for internal use"
    )
    .optional(),
  url: z
    .url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
      error: "Invalid URL format. Must be a valid HTTP or HTTPS URL like https://example.com"
    })
    .refine(
      (val) => reservedUrls.includes(val.split('://')[1]),
      "URL cannot point to Shurtle's own domain or localhost"
    ),
})

export type CreateShurtleFormState = {
  errors?: {
    slug?: string[]
    url?: string[]
    _form?: string[]
  }
  success?: boolean
  data?: {
    slug: string
    url: string
  }
}

const existingShurtlePrepared = db.query.shurtles.findFirst({
  where: (shurtles, { eq, and }) => and(eq(shurtles.slug, sql.placeholder('slug')), eq(shurtles.userId, sql.placeholder('userId'))),
  columns: { slug: true }
}).prepare('existingShurtle')

const existingUrlShurtlePrepared = db.query.shurtles.findFirst({
  where: (shurtles, { eq, and }) => and(eq(shurtles.url, sql.placeholder('url')), eq(shurtles.userId, sql.placeholder('userId'))),
  columns: { slug: true }
}).prepare('existingUrlShurtle')

export async function createShurtle(
  prevState: CreateShurtleFormState,
  formData: FormData,
): Promise<CreateShurtleFormState> {
  const { userId } = await auth()

  if (!userId) {
    return {
      errors: {
        _form: ["You must be signed in to create a shurtle"]
      }
    }
  }

  // Check for rate limits
  const { success } = await rateLimits.createShurtle.limiter.limit(userId)

  if (!success) {
    return {
      errors: {
        _form: [rateLimits.createShurtle.limitMessage]
      }
    }
  }

  // Get form data
  const slugValue = formData.get("slug")
  const url = formData.get("url") as string

  // Handle empty slug properly
  const slug = slugValue && String(slugValue).trim() !== "" ? String(slugValue) : null

  // Validate form data
  const validationResult = createShurtleSchema.safeParse({ slug, url })

  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors
    }
  }

  try {
    // Generate a slug if not provided
    const finalSlug = slug || nanoid(6)

    const existingShurtle = await existingShurtlePrepared.execute({
      slug: finalSlug,
      userId: userId
    })

    if (existingShurtle) {
      return {
        errors: {
          slug: ["This slug is already taken. Please choose another one."]
        }
      }
    }

    const existingUrlShurtle = await existingUrlShurtlePrepared.execute({
      url: url,
      userId: userId
    })

    if (existingUrlShurtle) {
      return {
        errors: {
          url: ["You already have a shurtle with this URL."]
        }
      }
    }

    // Create the shurtle
    await db.insert(shurtles).values({
      slug: finalSlug,
      url: url,
      userId: userId
    })

    // Revalidate cache
    revalidateTag(`user:${userId}`)
    revalidatePath("/dashboard")

    return {
      success: true,
      data: {
        slug: finalSlug,
        url
      }
    }
  } catch (error) {
    console.error("Error creating Shurtle:", error)
    return {
      errors: {
        _form: ["An error occurred while creating the shurtle. Please try again."]
      }
    }
  }
}

export async function deleteShurtle(slug: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  await db.delete(shurtles).where(and(eq(shurtles.slug, slug), eq(shurtles.userId, userId)))

  revalidateTag(`user:${userId}`)
  revalidatePath('/dashboard')

  return { success: true }
}
