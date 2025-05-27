import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { ipAddress } from '@vercel/functions';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimits } from './lib/ratelimits';
import { getUrlBySlug } from './lib/shurtles';

const isReservedRoute = createRouteMatcher(['/', '/dashboard(.*)', '/shurtle(.*)', '/not-found', '/api/(.*)'])
const isPublicRoute = createRouteMatcher(['/', '/not-found', '/api/(.*)'])

export default clerkMiddleware(async (auth, req, ctx) => {
  if (isReservedRoute(req)) {
    if (!isPublicRoute(req)) {
      await auth.protect()
    }
    return;
  }

  //If not a reserved route, we should try to match the slug and redirect.

  // Check for rate limits first
  const ip = ipAddress(req) || '127.0.0.1'; // Fallback to localhost if IP is not available

  let headers: Headers | undefined = undefined;

  if (ip) {
    const { success, limit, remaining, reset, pending } = await rateLimits.openShurtle.limiter.limit(ip)
    ctx.waitUntil(pending) // Explicitly wait for the rate limit check to complete

    headers = createRateLimitHeaders(req, limit, remaining, reset)

    if (!success) {
      // If the rate limit is exceeded, we should return a 429 response with the appropriate headers.
      return NextResponse.json({
        error: rateLimits.openShurtle.message,
      }, {
        status: 429,
        headers: headers,
      });
    }
  }

  const slug = req.nextUrl.pathname.split('/').pop()
  if (slug && slug.length > 0) {
    const url = await getUrlBySlug(slug)

    if (url) {
      return NextResponse.redirect(url, { headers: headers })
    } else {
      // If the slug is not found, we should return the not found page.
      return NextResponse.redirect(new URL('/not-found', req.url), { headers: headers })
    }
  }
})

function createRateLimitHeaders(req: NextRequest, limit: number, remaining: number, resetUnixTimestampMs: number) {
  const headers = new Headers(req.headers)
  headers.set('RateLimit-Limit', limit.toString())
  headers.set('RateLimit-Remaining', remaining.toString())

  const resetDelta = Math.floor((resetUnixTimestampMs - Date.now()) / 1000)
  headers.set('RateLimit-Reset', resetDelta.toString())

  return headers;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}