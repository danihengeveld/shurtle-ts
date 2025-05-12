import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { config } from "dotenv";

config({ path: "./.env.local" });

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle({ client: sql, schema, logger: true });