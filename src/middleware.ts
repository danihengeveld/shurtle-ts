import { getAuth, withClerkMiddleware } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Kysely } from "kysely";
import { PlanetScaleDialect } from "kysely-planetscale";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "./env.mjs";
import { type ShurtleDatabase } from "./lib/shurtle-kysely-types.js";

// Set the paths that do not result to redirection
const reservedPaths = ["/dashboard", "/preview"];

const isReserved = (path: string) => {
  return reservedPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace("*$", "($|/)")))
  );
};

const isApi = (path: string) => {
  return path.startsWith("/api");
};

export default withClerkMiddleware(
  async (req: NextRequest, event: NextFetchEvent) => {
    if (
      !isReserved(req.nextUrl.pathname) &&
      !isApi(req.nextUrl.pathname) &&
      req.nextUrl.pathname !== "/"
    ) {
      const ip = req.ip ?? "127.0.0.1";

      const { success, pending, limit, reset, remaining } =
        await ratelimit.limit(ip);

      event.waitUntil(pending);

      if (!success) {
        return addRatelimitHeaders(
          new NextResponse(null, {
            status: 429,
            statusText: "You have hit the rate limit.",
          }),
          limit,
          reset,
          remaining
        );
      }

      const db = new Kysely<ShurtleDatabase>({
        dialect: new PlanetScaleDialect({
          url: env.DATABASE_URL,
        }),
      });

      const shurtle = await db
        .selectFrom("Shurtle")
        .select(["slug", "url"])
        .where("slug", "=", req.nextUrl.pathname.replace("/", ""))
        .executeTakeFirst();

      if (!shurtle) {
        return addRatelimitHeaders(
          NextResponse.redirect(
            req.nextUrl.href.replace(req.nextUrl.pathname, "/")
          ),
          limit,
          reset,
          remaining
        );
      }

      await db
        .updateTable("Shurtle")
        .set(({ bxp }) => ({
          hits: bxp("hits", "+", 1),
        }))
        .where("slug", "=", shurtle.slug)
        .executeTakeFirst();

      return addRatelimitHeaders(
        NextResponse.redirect(shurtle.url),
        limit,
        reset,
        remaining
      );
    }

    if (req.nextUrl.pathname !== "/") {
      const { userId } = getAuth(req);

      if (!userId) {
        const signInUrl = new URL(env.NEXT_PUBLIC_CLERK_SIGNIN_URL);
        signInUrl.searchParams.set("redirect_url", req.url);
        return NextResponse.redirect(signInUrl);
      }
    }

    return NextResponse.next();
  }
);

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  prefix: "public",
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

const addRatelimitHeaders = (
  res: NextResponse,
  limit: number,
  reset: number,
  remaining: number
) => {
  res.headers.set("X-RateLimit-Limit", limit.toString());
  res.headers.set("X-RateLimit-Remaining", remaining.toString());
  res.headers.set("X-RateLimit-Reset", reset.toString());

  return res;
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - static (static files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/(.*?trpc.*?|(?!static|.*\\..*|_next|favicon.ico).*)",
    "/",
  ],
};
