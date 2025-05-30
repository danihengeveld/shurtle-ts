import { config } from 'dotenv';
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

config({ path: "./.env.local" });

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
  schemaFilter: ["shurtle"]
});
