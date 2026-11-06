import { defineConfig } from "drizzle-kit"
import { existsSync } from "node:fs"

// drizzle-kit runs outside Next.js, so load local env vars ourselves (Node >= 20.12).
if (existsSync(".env.local")) process.loadEnvFile(".env.local")

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is not set. Add it to .env.local (see README).")
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
  schemaFilter: ["shurtle"],
})
