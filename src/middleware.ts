import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { NextResponse } from 'next/server'
import { getUrlBySlug } from './lib/shurtles'

const isReservedRoute = createRouteMatcher(['/', '/dashboard(.*)', '/shurtle(.*)'])
const isPublicRoute = createRouteMatcher(['/'])

export default clerkMiddleware(async (auth, req) => {
  if (isReservedRoute(req)) {
    if (!isPublicRoute(req)) {
      await auth.protect()
    }
    return;
  }

  //If not a reserved route, we should try to match the slug and redirect.
  const slug = req.nextUrl.pathname.split('/').pop()
  if (slug && slug.length > 0) {
    const url = await getUrlBySlug(slug)
    if (url) {
      return NextResponse.redirect(url)
    } else {
      // If the slug is not found, we should return the not found page.
      notFound()
    }
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}