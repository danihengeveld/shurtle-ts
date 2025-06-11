"use server"

import { db } from "@/db"
import { shurtles } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { revalidatePath, revalidateTag } from "next/cache"
import { rateLimits } from "./ratelimits"
import { createShurtleSchema } from "./schemas"

export type CreateShurtleFormState = {
  errors?: {
    slug?: string[]
    url?: string[]
    expiresAt?: string[]
    _form?: string[]
  }
  success?: boolean
  data?: {
    slug: string
    url: string,
    expiresAt?: string
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
  const slug = formData.get("slug") as string | null | undefined
  const url = formData.get("url") as string
  const expiresAt = formData.get("expiresAt") as string | null | undefined

  // Validate form data
  const validationResult = createShurtleSchema.safeParse({ slug, url, expiresAt })
  if (!validationResult.success) {
    return {
      errors: validationResult.error.flatten().fieldErrors
    }
  }

  try {
    // Generate a slug if not provided
    const finalSlug = validationResult.data.slug || nanoid(6)

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
      url: validationResult.data.url,
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
      url: validationResult.data.url,
      expiresAt: validationResult.data.expiresAt ? new Date(validationResult.data.expiresAt) : null,
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
