import { clerkMiddleware } from "@clerk/nextjs/server";
import { geolocation, ipAddress } from "@vercel/functions";
import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { logger } from "./server/logger";
import { rateLimits } from "./server/ratelimits";
import { recordHit, resolveSlug } from "./server/queries";
import { isValidSlug } from "./lib/slugs";

/**
 * Clerk makes the session available to Server Components and Server Functions. Authorization is
 * enforced where the data is read (`requireUserId()`), not here — Clerk has deprecated
 * path-matching auth checks in the proxy.
 */
const clerk = clerkMiddleware();

export default async function proxy(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const slug = slugFromPath(request.nextUrl.pathname);

  // Short links skip Clerk entirely: they need no session and should redirect as fast as possible.
  if (slug) return resolveShortLink(request, event, slug);

  return clerk(request, event);
}

/** Returns the slug when `pathname` is a single, valid, non-reserved segment like `/abc123`. */
function slugFromPath(pathname: string) {
  const match = /^\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;

  try {
    const slug = decodeURIComponent(match[1]);
    return isValidSlug(slug) ? slug : null;
  } catch {
    return null; // Malformed percent-encoding
  }
}

async function resolveShortLink(
  request: NextRequest,
  event: NextFetchEvent,
  slug: string,
) {
  const headers = new Headers({ "Cache-Control": "private, no-store" });

  const ip = ipAddress(request);
  if (ip) {
    try {
      const { success, limit, remaining, reset, pending } =
        await rateLimits.openShurtle.limiter.limit(ip);
      event.waitUntil(pending);

      const resetSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
      headers.set("RateLimit-Limit", String(limit));
      headers.set("RateLimit-Remaining", String(remaining));
      headers.set("RateLimit-Reset", String(resetSeconds));

      if (!success) {
        logger.warn({ slug }, "rate limit exceeded opening short link");
        headers.set("Retry-After", String(resetSeconds));
        return NextResponse.rewrite(new URL("/slow-down", request.url), {
          status: 429,
          headers,
        });
      }
    } catch (error) {
      // Fail open: a rate limiter outage must not take every short link down with it.
      logger.error({ err: error }, "rate limiter unavailable, failing open");
    }
  }

  let link: Awaited<ReturnType<typeof resolveSlug>>;
  try {
    link = await resolveSlug(slug);
  } catch (error) {
    logger.error({ err: error, slug }, "failed to resolve short link");
    headers.set("Retry-After", "30");
    return new NextResponse(
      "Shurtle is temporarily unavailable. Please try again in a moment.",
      {
        status: 503,
        headers,
      },
    );
  }

  if (!link) {
    logger.debug({ slug }, "short link not found");
    // Keep the URL in the address bar so the 404 page can offer to claim the slug.
    return NextResponse.rewrite(new URL("/not-found", request.url), {
      status: 404,
      headers,
    });
  }

  if (link.expired) {
    logger.debug({ slug }, "short link expired");
    // 410 Gone: the link existed and won't come back (the slug stays taken). No hit is recorded.
    return NextResponse.rewrite(new URL("/expired", request.url), {
      status: 410,
      headers,
    });
  }

  // Debug only: every visit is already recorded in shurtle.hits, so production stays quiet.
  logger.debug({ slug }, "short link resolved");
  event.waitUntil(recordHit(slug, geolocation(request)));

  // 307 (not 301/308) so browsers don't cache the redirect: every visit is counted and edits apply.
  return NextResponse.redirect(link.url, { status: 307, headers });
}

export const config = {
  matcher: [
    // Skip Next.js internals, generated images (exact segment, so e.g. `/apple-icons` is still a
    // slug) and all static files incl. robots.txt / sitemap.xml, unless found in search params
    "/((?!_next|(?:opengraph-image|apple-icon|pwa-icon)(?![^/?])|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
