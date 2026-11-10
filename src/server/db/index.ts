import "server-only";

import { logger } from "@/server/logger";
import type { Logger } from "drizzle-orm/logger";
import { drizzle as drizzleHttp } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { isLocalDatabase } from "./local";

const url = process.env.POSTGRES_URL;
if (!url) {
  throw new Error(
    "POSTGRES_URL is not set. Add it to .env.local (see README).",
  );
}

/**
 * What the app may use: Neon's HTTP driver without what only one of the two drivers below has.
 * Every query is one statement over one HTTP request, so there are no interactive transactions
 * (`transaction`) and no Neon-only batches (`batch`): an atomic write is a single statement, such
 * as recordHit's insert and update in one query. Leaving them out of the type keeps local
 * development from relying on something production can't do.
 */
export type Database = Omit<
  NeonHttpDatabase,
  "transaction" | "batch" | "$client"
>;

// Opt-in SQL logging (`DEBUG_SQL=1 pnpm dev`) at debug level; always-on logging drowns out real
// dev warnings.
const sqlLogger: Logger | false = process.env.NODE_ENV === "development" &&
  process.env.DEBUG_SQL === "1" && {
    logQuery: (query, params) => logger.debug({ query, params }, "sql"),
  };

/**
 * Neon's HTTP driver for the hosted database: a query is a single fetch, with no connection to
 * open or keep alive. Neon serves that over HTTPS, which a plain Postgres doesn't, so the local
 * database (compose.yaml) is reached with node-postgres instead. Same SQL, same dialect.
 */
export const db: Database = isLocalDatabase(url)
  ? (drizzlePg(url, { logger: sqlLogger }) as unknown as Database)
  : drizzleHttp(url, { logger: sqlLogger });
