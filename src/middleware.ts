import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "./db";
import { shurtles } from "./db/schema";

// Set the paths that do not result to redirection
const reservedPaths = ["/", "/dashboard", "/create"];

const isReserved = (path: string) => {
  return reservedPaths.find((x) =>
    path.match(new RegExp(`^${x}$`.replace("*$", "($|/)")))
  );
};

const isApi = (path: string) => {
  return path.startsWith("/api");
};

export default authMiddleware({
  async afterAuth(auth, req, evt) {
    if (!isReserved(req.nextUrl.pathname) && !isApi(req.nextUrl.pathname)) {
      const ip = req.ip ?? "127.0.0.1";

      const { success, pending, limit, reset, remaining } =
        await ratelimit.limit(ip);

      evt.waitUntil(pending);

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

      const shurtle = await preparedGetShurtle.execute({
        slug: req.nextUrl.pathname.replace("/", ""),
      });

      if (!shurtle) {
        return addRatelimitHeaders(
          NextResponse.redirect(req.nextUrl.origin),
          limit,
          reset,
          remaining
        );
      }

      await db
        .update(shurtles)
        .set({
          hits: sql`${shurtles.hits} + 1`,
          lastHitAt: sql`current_timestamp(3)`,
        })
        .where(eq(shurtles.slug, shurtle.slug));

      return addRatelimitHeaders(
        NextResponse.redirect(shurtle.url),
        limit,
        reset,
        remaining
      );
    } else if (
      !isApi(req.nextUrl.pathname) &&
      isReserved(req.nextUrl.pathname) &&
      req.nextUrl.pathname !== "/" &&
      !auth.userId
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    return NextResponse.next();
  },
  publicRoutes: ["/"],
});

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

const preparedGetShurtle = db.query.shurtles
  .findFirst({
    columns: {
      slug: true,
      url: true,
    },
    where: (shurtles, { eq }) => eq(shurtles.slug, sql.placeholder("slug")),
  })
  .prepare();

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
