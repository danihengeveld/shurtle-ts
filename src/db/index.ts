import "server-only"

import { drizzle } from "drizzle-orm/neon-serverless"
import * as schema from "./schema"

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not set. Add it to .env.local (see README).")
}

// WebSocket-backed pool: supports interactive transactions (used when recording hits) and reuses
// connections across invocations on Vercel Fluid compute.
export const db = drizzle(process.env.POSTGRES_URL, {
  schema,
  logger: process.env.NODE_ENV === "development",
})
