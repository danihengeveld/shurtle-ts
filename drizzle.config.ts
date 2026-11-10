import { defineConfig } from "drizzle-kit";
import { existsSync } from "node:fs";

// drizzle-kit runs outside Next.js, so load local env vars ourselves, in the same order as `next dev`:
// the environment wins, then .env.development.local (the local database, see .env.example), then
// .env.local. loadEnvFile never overwrites a variable that is already set.
for (const file of [".env.development.local", ".env.local"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

if (!process.env.POSTGRES_URL) {
  throw new Error(
    "POSTGRES_URL is not set. Add it to .env.local (see README).",
  );
}

// Say which database this is about to change, without the credentials.
console.log(
  `drizzle-kit: using database at ${new URL(process.env.POSTGRES_URL).host}`,
);

export default defineConfig({
  out: "./drizzle",
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
  schemaFilter: ["shurtle"],
});
