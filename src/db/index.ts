import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.POSTGRES_URL!)
export const db = drizzle({ client: sql, schema, logger: true });