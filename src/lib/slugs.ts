/**
 * Single source of truth for slug rules. Shared by the create-shurtle schema (validation),
 * the proxy (which paths are treated as short links) and the UI (hints / input constraints).
 * Client-safe: no server-only imports.
 */

export const SLUG_MIN_LENGTH = 1;
export const SLUG_MAX_LENGTH = 64;
export const SLUG_PATTERN = /^[A-Za-z0-9_-]+$/;
/** Same rule as SLUG_PATTERN, for the HTML `pattern` attribute. */
export const SLUG_HTML_PATTERN = "[A-Za-z0-9_\\-]+";

/** Length of auto-generated slugs. */
export const GENERATED_SLUG_LENGTH = 7;

/**
 * Top-level paths owned by the app (or reserved for future use). A slug may never equal one of
 * these, compared case-insensitively. Every top-level route in `src/app` MUST be listed here,
 * including metadata routes such as `opengraph-image` and `icon`.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // App routes
  "api",
  "dashboard",
  "demo",
  "expired",
  "not-found",
  "slow-down",
  "pwa-icon",
  // Metadata routes
  "icon",
  "apple-icon",
  "opengraph-image",
  "twitter-image",
  "manifest",
  "robots",
  "sitemap",
  // Framework / reserved for future use
  "_next",
  "_vercel",
  "about",
  "admin",
  "app",
  "assets",
  "auth",
  "help",
  "login",
  "logout",
  "privacy",
  "settings",
  "shurtle",
  "sign-in",
  "sign-out",
  "sign-up",
  "static",
  "terms",
]);

export function isReservedSlug(slug: string) {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/** True when `slug` is syntactically valid and not reserved. */
export function isValidSlug(slug: string) {
  return (
    slug.length >= SLUG_MIN_LENGTH &&
    slug.length <= SLUG_MAX_LENGTH &&
    SLUG_PATTERN.test(slug) &&
    !isReservedSlug(slug)
  );
}
