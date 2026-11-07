import "server-only";

import type { LinkListQuery } from "@/lib/link-list";
import type { Visit } from "@/lib/visit";
import { RENEWAL_WINDOW_HOURS, releaseTime } from "@/lib/link-lifecycle";
import { db } from "@/server/db";
import { shurtleHits, shurtles } from "@/server/db/schema";
import type { Geo } from "@vercel/functions";
import { and, asc, desc, eq, gte, ilike, not, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { requireUserId } from "./auth";
import { logger } from "./logger";
import { shurtlesTag, statsTag } from "./tags";

/*
 * Link states in SQL. See src/lib/link-lifecycle.ts for the lifecycle these encode.
 */

const renewalWindow = sql.raw(`interval '${RENEWAL_WINDOW_HOURS} hours'`);

/**
 * The single definition of "expired": released, or past its expiry moment (even if the cron hasn't
 * released it yet). `coalesce` keeps never-expiring links (`expires_at is null`) out of it: a bare
 * comparison would be null, and `not (null)` is null too, so they'd drop out of both lists.
 */
export const isExpired = sql<boolean>`(${shurtles.archivedAt} is not null or coalesce(${shurtles.expiresAt} <= now(), false))`;

/** Expired, but its slug is still reserved: only the owner can bring it back. */
export const isRenewable = sql<boolean>`(${shurtles.archivedAt} is null and ${shurtles.expiresAt} <= now() and ${shurtles.expiresAt} + ${renewalWindow} > now())`;

/** Still holds its slug: live, or renewable. Only these can get a new expiry. */
export const holdsSlug = sql<boolean>`(${shurtles.archivedAt} is null and (${shurtles.expiresAt} is null or ${shurtles.expiresAt} + ${renewalWindow} > now()))`;

/** Its renewal window is over but it hasn't been marked released yet (the cron runs daily). */
export const isReleaseDue = sql<boolean>`(${shurtles.archivedAt} is null and ${shurtles.expiresAt} + ${renewalWindow} <= now())`;

/**
 * The user's next state change (or null): an expiry, or the end of a renewal window. Cached lists
 * and counts go out of date at that moment, with no mutation to call `updateTag`.
 */
const nextChange = sql<Date | null>`least(
  min(${shurtles.expiresAt}) filter (where ${shurtles.archivedAt} is null and ${shurtles.expiresAt} > now()),
  min(${shurtles.expiresAt} + ${renewalWindow}) filter (where ${isRenewable})
)`.mapWith(shurtles.expiresAt);

/**
 * The built-in "minutes" profile (stale 5 min, revalidate 1 min, expire 1 h), cut short so the entry
 * expires at the user's next state change. Without this, a link that expires (or is released)
 * naturally would stay in the wrong list, with stale counts, until the cache ran out.
 * Only computes the profile: pass it to `cacheLife` in the cached function itself.
 */
function minutesProfileUntil(next: Date | null) {
  const seconds = next
    ? Math.max(1, Math.ceil((next.getTime() - Date.now()) / 1000))
    : Infinity;
  return {
    stale: Math.min(300, seconds),
    revalidate: Math.min(60, seconds),
    expire: Math.min(3600, seconds),
  };
}

/*
 * Per-user reads. The exported getters resolve the signed-in user themselves; the cached
 * `…ByUserId` functions stay private, so no caller can pass someone else's id.
 */

export async function getStats() {
  return getStatsByUserId(await requireUserId());
}

/** Clicks per UTC day for the last `days` days (oldest first, zero-filled, includes today). */
export async function getDailyClicks(days = 30) {
  return getDailyClicksByUserId(await requireUserId(), days);
}

export async function getShurtlesPaginated(query: LinkListQuery) {
  return getShurtlesPaginatedByUserId(await requireUserId(), query);
}

/** The user's renewable links, the soonest to be released first. */
export async function getRenewableShurtles(limit: number) {
  return getRenewableShurtlesByUserId(await requireUserId(), limit);
}

export type ShurtleStats = {
  totalShurtles: number;
  /** Shurtles that have not expired. */
  activeShurtles: number;
  /** Includes the renewable ones. */
  expiredShurtles: number;
  /** Expired, slug still reserved for the owner. */
  renewableShurtles: number;
  totalHits: number;
};

export type DailyClicks = {
  /** UTC calendar day, `YYYY-MM-DD`. */
  date: string;
  clicks: number;
};

/** The columns the dashboard lists render. */
const listColumns = {
  id: shurtles.id,
  slug: shurtles.slug,
  url: shurtles.url,
  hits: shurtles.hits,
  createdAt: shurtles.createdAt,
  lastHitAt: shurtles.lastHitAt,
  expiresAt: shurtles.expiresAt,
  archivedAt: shurtles.archivedAt,
};

async function getStatsByUserId(userId: string): Promise<ShurtleStats> {
  "use cache";
  cacheTag(statsTag(userId));

  const [row] = await db
    .select({
      totalShurtles: sql<number>`count(*)::int`,
      activeShurtles: sql<number>`(count(*) filter (where not ${isExpired}))::int`,
      expiredShurtles: sql<number>`(count(*) filter (where ${isExpired}))::int`,
      renewableShurtles: sql<number>`(count(*) filter (where ${isRenewable}))::int`,
      totalHits: sql<number>`coalesce(sum(${shurtles.hits}), 0)::int`,
      nextChange,
    })
    .from(shurtles)
    .where(eq(shurtles.userId, userId));

  cacheLife(minutesProfileUntil(row?.nextChange ?? null));
  return {
    totalShurtles: row?.totalShurtles ?? 0,
    activeShurtles: row?.activeShurtles ?? 0,
    expiredShurtles: row?.expiredShurtles ?? 0,
    renewableShurtles: row?.renewableShurtles ?? 0,
    totalHits: row?.totalHits ?? 0,
  };
}

async function getDailyClicksByUserId(
  userId: string,
  days: number,
): Promise<DailyClicks[]> {
  "use cache";
  cacheTag(statsTag(userId));
  cacheLife("minutes");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const since = new Date(today.getTime() - (days - 1) * 86_400_000);

  const day = sql<string>`to_char(date_trunc('day', ${shurtleHits.at} at time zone 'UTC'), 'YYYY-MM-DD')`;
  const rows = await db
    .select({ date: day, clicks: sql<number>`count(*)::int` })
    .from(shurtleHits)
    .innerJoin(shurtles, eq(shurtles.id, shurtleHits.shurtleId))
    .where(
      and(
        eq(shurtles.userId, userId),
        gte(shurtleHits.at, since),
        eq(shurtleHits.isBot, false),
      ),
    )
    .groupBy(day);

  const clicksByDate = new Map(rows.map((row) => [row.date, row.clicks]));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(since.getTime() + index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return { date, clicks: clicksByDate.get(date) ?? 0 };
  });
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

/** The user's next state change, for `minutesProfileUntil`. */
function nextChangeForUser(userId: string) {
  return db
    .select({ nextChange })
    .from(shurtles)
    .where(eq(shurtles.userId, userId));
}

async function getShurtlesPaginatedByUserId(
  userId: string,
  { page, perPage, query, status }: LinkListQuery,
) {
  "use cache";
  cacheTag(shurtlesTag(userId));

  const pattern = `%${escapeLike(query)}%`;
  const where = and(
    eq(shurtles.userId, userId),
    status === "expired" ? isExpired : not(isExpired),
    query
      ? or(ilike(shurtles.slug, pattern), ilike(shurtles.url, pattern))
      : undefined,
  );

  const [rows, totalCount, [upcoming]] = await Promise.all([
    db
      .select(listColumns)
      .from(shurtles)
      .where(where)
      // Active: newest first. Expired: most recently expired first (so renewable ones lead).
      .orderBy(
        ...(status === "expired" ? [desc(shurtles.expiresAt)] : []),
        desc(shurtles.createdAt),
        shurtles.id,
      )
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.$count(shurtles, where),
    nextChangeForUser(userId),
  ]);

  cacheLife(minutesProfileUntil(upcoming?.nextChange ?? null));
  return {
    shurtles: rows,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / perPage)),
    page,
    perPage,
    query,
    status,
  };
}

async function getRenewableShurtlesByUserId(userId: string, limit: number) {
  "use cache";
  cacheTag(shurtlesTag(userId));

  const [rows, [upcoming]] = await Promise.all([
    db
      .select(listColumns)
      .from(shurtles)
      .where(and(eq(shurtles.userId, userId), isRenewable))
      .orderBy(asc(shurtles.expiresAt), shurtles.id)
      .limit(limit),
    nextChangeForUser(userId),
  ]);

  cacheLife(minutesProfileUntil(upcoming?.nextChange ?? null));
  return rows;
}

const resolveSlugPrepared = db
  .select({
    id: shurtles.id,
    url: shurtles.url,
    expiresAt: shurtles.expiresAt,
    expired: isExpired,
    released: sql<boolean>`(${shurtles.archivedAt} is not null or coalesce(${isReleaseDue}, false))`,
  })
  .from(shurtles)
  .where(eq(shurtles.slug, sql.placeholder("slug")))
  // The unreleased link holding the slug, if any; otherwise the most recently released one.
  .orderBy(sql`${shurtles.archivedAt} desc nulls first`)
  .limit(1)
  .prepare("resolveSlug");

export type ResolvedSlug =
  | { state: "live"; id: string; url: string }
  /** Expired. `releasesAt` is when anyone can claim the slug, or null when they already can. */
  | { state: "expired"; releasesAt: Date | null };

/** Look up a short link: `null` when the slug has never been used (or its link was deleted). */
export async function resolveSlug(slug: string): Promise<ResolvedSlug | null> {
  const [row] = await resolveSlugPrepared.execute({ slug });
  if (!row) return null;
  if (!row.expired) return { state: "live", id: row.id, url: row.url };
  return {
    state: "expired",
    releasesAt:
      row.released || !row.expiresAt ? null : releaseTime(row.expiresAt),
  };
}

function parseCoordinate(value: string | undefined) {
  const parsed = value === undefined ? Number.NaN : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Record a visit to a link. Runs in the background after the redirect is sent; never throws.
 * A bot's visit is stored with its flag, but doesn't count as a click on the link.
 */
export async function recordHit(shurtleId: string, geo: Geo, visit: Visit) {
  const longitude = parseCoordinate(geo.longitude);
  const latitude = parseCoordinate(geo.latitude);
  const hit = {
    shurtleId,
    country: geo.country,
    region: geo.countryRegion,
    city: geo.city,
    coordinates:
      longitude !== null && latitude !== null
        ? { x: longitude, y: latitude }
        : null,
    ...visit,
  };

  try {
    if (visit.isBot) {
      await db.insert(shurtleHits).values(hit);
      return;
    }

    await db.transaction(async (tx) => {
      await tx.insert(shurtleHits).values(hit);
      await tx
        .update(shurtles)
        .set({ hits: sql`${shurtles.hits} + 1`, lastHitAt: sql`now()` })
        .where(eq(shurtles.id, shurtleId));
    });
  } catch (error) {
    logger.error({ err: error, shurtleId }, "failed to record hit");
  }
}
