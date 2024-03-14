import type { Config } from "drizzle-kit";

import * as dotenv from 'dotenv'

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
dotenv.config({path: ".env.development.local"})

export default {
  schema: "./src/db/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL_NON_POOLING as string
  },
  tablesFilter: ["shurtle_*"]
} satisfies Config;
