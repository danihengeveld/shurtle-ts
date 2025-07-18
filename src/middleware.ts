import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { geolocation, ipAddress } from '@vercel/functions'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimits } from './lib/ratelimits'
import { getUrlBySlug, recordHit } from './lib/shurtles'
import { logger } from './lib/logger'

const isReservedRoute = createRouteMatcher(['/', '/dashboard(.*)', '/shurtle(.*)', '/not-found', '/api/(.*)', '/sitemap.xml', '/robots.txt'])
const isPublicRoute = createRouteMatcher(['/', '/not-found', '/api/(.*)', '/sitemap.xml', '/robots.txt'])

export default clerkMiddleware(async (auth, req, ctx) => {
  const path = req.nextUrl.pathname;
  logger.debug(`Middleware processing request: ${req.method} ${path}`);

  if (isReservedRoute(req)) {
    logger.debug(`Request to reserved route: ${path}`);
    if (!isPublicRoute(req)) {
      logger.debug(`Protected route access: ${path}`);
      await auth.protect()
    }
    return
  }

  logger.info(`Processing potential shurtle slug: ${path}`);
  //If not a reserved route, we should try to match the slug and redirect.

  // Check for rate limits first
  const ip = ipAddress(req) || '127.0.0.1' // Fallback to localhost if IP is not available
  logger.debug(`Request IP address: ${ip}`);

  let headers: Headers | undefined = undefined

  if (ip) {
    logger.debug(`Checking rate limit for IP: ${ip}`);
    const { success, limit, remaining, reset, pending } = await rateLimits.openShurtle.limiter.limit(ip)
    ctx.waitUntil(pending) // Explicitly wait for the rate limit check to complete

    headers = createRateLimitHeaders(req, limit, remaining, reset)
    logger.debug(`Rate limit headers set: limit=${limit}, remaining=${remaining}`);

    if (!success) {
      // If the rate limit is exceeded, we should return a 429 response with the appropriate headers.
      logger.warn(`Rate limit exceeded for IP: ${ip}, path: ${req.nextUrl.pathname}`);
      return NextResponse.json({
        message: rateLimits.openShurtle.limitMessage
      }, {
        status: 429,
        headers: headers
      })
    }
  }

  const slug = req.nextUrl.pathname.split('/').pop()

  if (slug && slug.length > 0) {
    logger.debug(`Attempting to resolve slug: ${slug}`)
    const url = await getUrlBySlug(slug)

    if (url) {
      const requestGeo = geolocation(req)
      logger.info(`Redirecting slug: ${slug} to ${url}`)
      ctx.waitUntil(recordHit(slug, requestGeo)) // Record the hit on a background process
      return NextResponse.redirect(url, { headers: headers })
    } else {
      logger.info(`Slug not found: ${slug}`)
      // If the slug is not found, we should return the not found page.
      return NextResponse.redirect(new URL('/not-found', req.url), { headers: headers })
    }
  }
})

function createRateLimitHeaders(req: NextRequest, limit: number, remaining: number, resetUnixTimestampMs: number) {
  const headers = new Headers(req.headers)
  headers.set('Retry-After', new Date(resetUnixTimestampMs).toUTCString())
  headers.set('RateLimit-Limit', limit.toString())
  headers.set('RateLimit-Remaining', remaining.toString())

  const resetDeltaSeconds = Math.floor((resetUnixTimestampMs - Date.now()) / 1000)
  headers.set('RateLimit-Reset', resetDeltaSeconds.toString())

  return headers
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
}