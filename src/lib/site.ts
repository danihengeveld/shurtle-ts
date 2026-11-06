import packageJson from "../../package.json"

/**
 * Public origin used to build absolute URLs (metadata, sitemap, short links).
 * Override with NEXT_PUBLIC_SITE_URL, e.g. for self-hosting or preview deployments.
 */
function resolveBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.NODE_ENV === "development") return "http://localhost:3000"
  return "https://shurtle.app"
}

export const siteInfo = {
  name: "Shurtle",
  tagline: "Short links, shell-shocked speed.",
  description: "An open source and blazingly fast URL shortener.",
  baseUrl: new URL(resolveBaseUrl()),
  repoUrl: "https://github.com/danihengeveld/shurtle-ts",
  releasesUrl: "https://github.com/danihengeveld/shurtle-ts/releases",
  version: packageJson.version,
  author: {
    name: "Dani Hengeveld",
    url: "https://dani.hengeveld.dev",
    twitter: "@DHengeveld",
  },
} as const

/** Absolute short link for a slug, e.g. `https://shurtle.app/abc123`. */
export function shortUrl(slug: string) {
  return new URL(encodeURIComponent(slug), siteInfo.baseUrl).toString()
}

/** Short link without the protocol, for display, e.g. `shurtle.app/abc123`. */
export function displayShortUrl(slug: string) {
  return `${siteInfo.baseUrl.host}/${slug}`
}
