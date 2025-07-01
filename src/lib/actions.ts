"use server"

import { db } from "@/db"
import { shurtles } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"
import { revalidatePath, revalidateTag } from "next/cache"
import { logger } from "./logger"
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
    logger.warn("Unauthenticated user attempted to create a shurtle")
    return {
      errors: {
        _form: ["You must be signed in to create a shurtle"]
      }
    }
  }

  logger.info(`User ${userId} attempting to create a new shurtle`)

  // Check for rate limits
  const { success } = await rateLimits.createShurtle.limiter.limit(userId)

  if (!success) {
    logger.warn(`Rate limit exceeded for user ${userId} when creating a shurtle`)
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

  logger.debug(`Create shurtle request: slug=${slug || 'auto-generated'}, url=${url}, expiresAt=${expiresAt || 'never'}`)

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
      logger.warn(`User ${userId} attempted to create a duplicate slug: ${finalSlug}`)
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

    logger.info(`Successfully created shurtle for user ${userId}: ${finalSlug} -> ${url}`, {
      expiresAt: validationResult.data.expiresAt || 'never'
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
    logger.error(`Error creating shurtle for user ${userId}:`, error)
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
    logger.warn(`Unauthenticated user attempted to delete shurtle: ${slug}`)
    throw new Error("Unauthorized")
  }

  logger.info(`User ${userId} attempting to delete shurtle: ${slug}`)

  const result = await db.delete(shurtles)
    .where(and(eq(shurtles.slug, slug), eq(shurtles.userId, userId)))
    .returning({ slug: shurtles.slug })

  if (result.length === 0) {
    logger.warn(`User ${userId} attempted to delete non-existent or unauthorized shurtle: ${slug}`)
  } else {
    logger.info(`User ${userId} successfully deleted shurtle: ${slug}`)
  }

  revalidateTag(`user:${userId}`)
  revalidatePath('/dashboard')

  return { success: true }
}
