import { z } from "zod/v4"

// Reserved slugs that should not be used
// These paths are reserved for internal use and should not be used as slugs by users
const reservedSlugs = ['dashboard', 'shurtle', 'api', '_next', 'sign-in', 'sign-up']

// Reserved URLs that should not be used
const reservedUrls = ['localhost', 'shurtle.app', 'www.shurtle.app']

// Schema for create shurtle validation
export const createShurtleSchema = z.object({
  slug: z
    .string()
    .trim()
    .nullish()
    .refine(
      (val) => !val || /^[a-zA-Z0-9_-]+$/.test(val),
      "Slug can only contain letters, numbers, underscores, and hyphens"
    )
    .refine(
      (val) => !val || !reservedSlugs.includes(val),
      "Slug is reserved for internal use"
    ),
  url: z
    .url({
      protocol: /^https?$/,
      hostname: z.regexes.domain,
      error: "Invalid URL format. Must be a valid HTTP or HTTPS URL like https://example.com"
    })
    .refine(
      (val) => !reservedUrls.includes(val.split('://')[1]),
      "URL cannot point to Shurtle's own domain or localhost"
    ),
  expiresAt: z
    .iso.datetime({
      error: "Invalid date format. Must be a valid ISO date string like 2025-05-28T23:59:59Z"
    })
    .nullish()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      "Expiration date must be in the future",
    )
})