"use server"

import { db } from "@/db"
import { shurtles } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import { revalidatePath, revalidateTag } from "next/cache"
import { z } from "zod"

// Reserved slugs that should not be used
// These paths are reserved for internal use and should not be used as slugs by users
const reservedSlugs = ['dashboard', 'shurtle', 'api', '_next', 'sign-in', 'sign-up']

// Schema for create shurtle validation
const createShurtleSchema = z.object({
  slug: z
    .string()
    .trim()
    .nullable()
    .transform((val) => (val === "" ? null : val)) // Transform empty string to null
    .refine(
      (val) => val === null || /^[a-zA-Z0-9_-]+$/.test(val),
      "Slug can only contain letters, numbers, underscores, and hyphens",
    )
    .refine(
      (val) => val === null || !reservedSlugs.includes(val),
      "Slug is reserved for internal use",
    )
    .optional(),
  url: z
    .string()
    .trim()
    .url("Please enter a valid URL")
    .refine(
      (val) => val.startsWith("http://") || val.startsWith("https://"),
      "URL must start with http:// or https://",
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

export async function createShurtle(
  prevState: CreateShurtleFormState,
  formData: FormData,
): Promise<CreateShurtleFormState> {
  const { userId } = await auth()

  if (!userId) {
    return {
      errors: {
        _form: ["You must be signed in to create a shurtle"],
      },
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
      errors: validationResult.error.flatten().fieldErrors,
    }
  }

  try {
    // Generate a slug if not provided
    const finalSlug = slug || nanoid(6)

    // Check if slug already exists
    const existingShurtle = await db
      .select({ slug: shurtles.slug })
      .from(shurtles)
      .where(eq(shurtles.slug, finalSlug))
      .limit(1)

    if (existingShurtle.length > 0) {
      return {
        errors: {
          slug: ["This slug is already taken. Please choose another one."],
        },
      }
    }

    // Check if user has already created a shurtle with the same URL
    const existingUrlShurtle = await db
      .select({ slug: shurtles.slug })
      .from(shurtles)
      .where(and(eq(shurtles.url, url), eq(shurtles.creatorId, userId)))
      .limit(1)

    if (existingUrlShurtle.length > 0) {
      return {
        errors: {
          url: ["You already have a shurtle with this URL."],
        },
      }
    }

    // Create the shurtle
    await db.insert(shurtles).values({
      slug: finalSlug,
      url,
      creatorId: userId
    })

    // Revalidate cache
    revalidateTag(`user:${userId}`)
    revalidatePath("/dashboard")

    return {
      success: true,
      data: {
        slug: finalSlug,
        url,
      },
    }
  } catch (error) {
    console.error("Error creating shurtle:", error)
    return {
      errors: {
        _form: ["An error occurred while creating the shurtle. Please try again."],
      },
    }
  }
}

export async function deleteShurtle(slug: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  await db.delete(shurtles).where(and(eq(shurtles.slug, slug), eq(shurtles.creatorId, userId)))

  revalidateTag(`user:${userId}`)
  revalidatePath('/dashboard')

  return { success: true }
}
