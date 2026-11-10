import { z } from "zod";
import { siteInfo } from "./site";
import { SLUG_MAX_LENGTH, SLUG_PATTERN, isReservedSlug } from "./slugs";

export const URL_MAX_LENGTH = 2048;

// Short links may not point back at Shurtle itself (redirect loops) or at local hosts.
const blockedHosts = new Set([
  "localhost",
  "shurtle.app",
  siteInfo.baseUrl.hostname,
]);

function isBlockedHost(url: string) {
  // Zod still runs refinements after a failed format check, so the input may not be a valid URL.
  const host = URL.parse(url)?.hostname.toLowerCase();
  if (!host) return false;
  for (const blocked of blockedHosts) {
    if (host === blocked || host.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

/** Treat empty / whitespace-only form fields as "not provided". */
function emptyToUndefined(value: unknown) {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

/**
 * A leading `scheme:`, unless what follows the colon is a port (`example.com:8080/page`). Not just
 * `scheme://`: `mailto:me@example.com` would otherwise become `https://mailto:me@example.com`, a
 * valid URL with `mailto` as its user name.
 */
const SCHEME_PATTERN = /^[a-z][a-z\d+\-.]*:(?!\d+(?:[/?#]|$))/i;

/**
 * Accept `example.com/page` (and `example.com:8080/page`) by assuming https when no scheme is
 * given. Inputs like `mailto:x` keep theirs and fail the URL check below.
 */
function withDefaultScheme(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed && !SCHEME_PATTERN.test(trimmed)
    ? `https://${trimmed}`
    : trimmed;
}

const urlTooLong = `URLs can be at most ${URL_MAX_LENGTH} characters long.`;

export const createShurtleSchema = z.object({
  url: z.preprocess(
    withDefaultScheme,
    z
      .string({ error: "Enter a URL to shorten." })
      .min(1, "Enter a URL to shorten.")
      // Cheap bound before parsing; checked again after normalizing (percent-encoding grows it).
      .max(URL_MAX_LENGTH, urlTooLong)
      .pipe(
        // `normalize` stores one canonical form (lowercase host, percent-encoded ASCII path), so the
        // "already shortened" check matches `Example.com` and `example.com`, and the stored URL is
        // ASCII as the unique index on (user_id, url) assumes.
        z.url({
          protocol: /^https?$/,
          hostname: z.regexes.domain,
          normalize: true,
          error: "Enter a valid web address, like https://example.com.",
        }),
      )
      .pipe(z.string().max(URL_MAX_LENGTH, urlTooLong))
      .refine(
        (value) => !isBlockedHost(value),
        "Links can't point to Shurtle itself or to localhost.",
      ),
  ),
  slug: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(
        SLUG_MAX_LENGTH,
        `Slugs can be at most ${SLUG_MAX_LENGTH} characters long.`,
      )
      .regex(
        SLUG_PATTERN,
        "Use only letters, numbers, hyphens and underscores.",
      )
      .refine(
        (value) => !isReservedSlug(value),
        "That slug is reserved. Please pick another one.",
      )
      .optional(),
  ),
  expiresAt: z.preprocess(
    emptyToUndefined,
    z.iso
      .datetime({ offset: true, error: "Pick a valid expiration date." })
      .refine(
        (value) => new Date(value) > new Date(),
        "The expiration date must be in the future.",
      )
      .optional(),
  ),
});
