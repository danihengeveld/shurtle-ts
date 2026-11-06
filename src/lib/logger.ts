import "server-only";

import pino from "pino";
import { serializeError } from "./log-serializers";

/**
 * Structured server logger. Pass values as fields, never inside the message:
 *
 *   logger.info({ userId, slug }, "shurtle created")
 *   logger.error({ err: error, slug }, "failed to record hit")
 *
 * Production writes one JSON object per line, which Vercel's log viewer parses and filters by
 * field. Development pretty-prints through pino-pretty as a synchronous stream; pino's worker-thread
 * transports don't work inside Next.js bundles. `LOG_LEVEL` overrides the default level.
 *
 * Personal data: log Clerk user ids and slugs, never IP addresses, emails, visitor locations or full
 * destination URLs (use `urlHost`). Errors go through `serializeError`, which strips query
 * parameters and row values from database errors.
 */
const serializers = { err: serializeError };

function createLogger() {
  if (process.env.NODE_ENV === "production") {
    return pino({
      level: process.env.LOG_LEVEL ?? "info",
      serializers,
      // Drop pid/hostname; Vercel adds its own request and deployment metadata.
      base: undefined,
      // `"level":"warn"` and an ISO time instead of `40` and epoch millis: readable in any viewer.
      formatters: { level: (label) => ({ level: label }) },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  // Dev-only dependency, required lazily: this branch is removed from production builds.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pretty = require("pino-pretty") as typeof import("pino-pretty");
  return pino(
    { level: process.env.LOG_LEVEL ?? "debug", serializers },
    pretty({
      sync: true,
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:HH:MM:ss",
    }),
  );
}

export const logger = createLogger();
