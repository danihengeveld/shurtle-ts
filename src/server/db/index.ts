import "server-only";

import { logger } from "@/server/logger";
import { neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { isLocalDatabase } from "./local";

if (!process.env.POSTGRES_URL) {
  throw new Error(
    "POSTGRES_URL is not set. Add it to .env.local (see README).",
  );
}

// Local development (compose.yaml): Neon's driver speaks Postgres over WebSockets, so a local
// Postgres needs a WebSocket proxy in front of it, without TLS. Never applies to a remote database.
if (isLocalDatabase(process.env.POSTGRES_URL)) {
  const proxy = process.env.POSTGRES_WSPROXY ?? "localhost:54321";
  neonConfig.wsProxy = () => `${proxy}/v1`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}

// WebSocket-backed pool: supports interactive transactions (used when recording hits) and reuses
// connections across invocations on Vercel Fluid compute.
export const db = drizzle(process.env.POSTGRES_URL, {
  // Opt-in SQL logging (`DEBUG_SQL=1 pnpm dev`) at debug level; always-on logging drowns out real
  // dev warnings.
  logger: process.env.NODE_ENV === "development" &&
    process.env.DEBUG_SQL === "1" && {
      logQuery: (query, params) => logger.debug({ query, params }, "sql"),
    },
});
