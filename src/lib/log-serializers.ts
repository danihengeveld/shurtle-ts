import { DrizzleQueryError } from "drizzle-orm"

/**
 * pino `err` serializer that keeps what's needed to debug and drops personal data.
 *
 * pino's default serializer copies every enumerable property. For database errors that leaks the
 * bound values: DrizzleQueryError carries them in `params`, its message and its stack
 * (`params: <slug>,<destination url>,<user id>…`), and Postgres errors put row values in `detail`
 * (`Key (user_id, url)=(…) already exists`). Destination URLs can contain tokens, and hit inserts
 * contain visitor locations, so only the SQL text (with placeholders), Postgres' error code and
 * constraint name, and the cause chain are kept.
 */
export function serializeError(error: unknown, depth = 0): unknown {
  if (!(error instanceof Error)) return error

  if (error instanceof DrizzleQueryError) {
    return {
      type: "DrizzleQueryError",
      message: "Failed query",
      query: error.query,
      // The stack starts with the full message, params included.
      stack: error.stack?.replace(error.message, "Failed query"),
      ...cause(error, depth),
    }
  }

  const { code, constraint } = error as Error & {
    code?: unknown
    constraint?: unknown
  }
  return {
    type: error.name,
    message: error.message,
    stack: error.stack,
    ...(typeof code === "string" ? { code } : {}),
    ...(typeof constraint === "string" ? { constraint } : {}),
    ...cause(error, depth),
  }
}

function cause(error: Error, depth: number) {
  // Bounded: cause chains can be cyclic.
  return error.cause === undefined || depth >= 3
    ? {}
    : { cause: serializeError(error.cause, depth + 1) }
}

/** Host of a destination URL for logs: enough to triage abuse, without paths or query strings. */
export function urlHost(url: string) {
  return URL.parse(url)?.hostname ?? null
}
