"use server"

import { db } from "@/db"
import { shurtles } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function deleteShurtle(slug: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  await db.delete(shurtles).where(and(eq(shurtles.slug, slug), eq(shurtles.creatorId, userId)))

  revalidatePath("/dashboard")

  return { success: true }
}