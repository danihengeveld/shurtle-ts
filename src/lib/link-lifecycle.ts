/**
 * The life of a short link, shared by the database queries, the proxy and the UI. Client-safe.
 *
 *   live ──(expires_at passes)──▶ renewable ──(24 h later)──▶ released
 *
 * - **Live**: redirects.
 * - **Renewable**: expired and no longer redirects, but its slug stays reserved: only the owner can
 *   bring it back (with a new expiry), keeping its click history.
 * - **Released**: still listed under Expired with its history, but the slug is free for anyone to
 *   claim. In the database a released link is `archived_at is not null`; the daily cron (or the next
 *   claim of the slug, whichever comes first) sets it, so "released" is decided by the clock, not
 *   by the column.
 */

export const RENEWAL_WINDOW_HOURS = 24;
export const RENEWAL_WINDOW_MS = RENEWAL_WINDOW_HOURS * 3_600_000;

/** When an expired link's slug becomes free for others to claim. */
export function releaseTime(expiresAt: Date) {
  return new Date(expiresAt.getTime() + RENEWAL_WINDOW_MS);
}

export type LinkLifecycle =
  | { state: "live"; expiresAt: Date | null }
  | { state: "renewable"; expiresAt: Date; releasesAt: Date }
  | { state: "released"; expiresAt: Date | null };

/**
 * Where a link is in its life at `now`. `archived` links are always released (a slug can be
 * released early when its owner shortens the same URL again).
 */
export function linkLifecycle(
  { expiresAt, archived }: { expiresAt: Date | null; archived: boolean },
  now: number,
): LinkLifecycle {
  if (archived) return { state: "released", expiresAt };
  if (!expiresAt || expiresAt.getTime() > now)
    return { state: "live", expiresAt };
  const releasesAt = releaseTime(expiresAt);
  return releasesAt.getTime() > now
    ? { state: "renewable", expiresAt, releasesAt }
    : { state: "released", expiresAt };
}
