import "server-only";

import { db } from "@/server/db";
import { shurtleHits, shurtles } from "@/server/db/schema";
import type { Geo } from "@vercel/functions";
import { and, desc, eq, gte, ilike, not, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { requireUserId } from "./auth";
import { logger } from "./logger";
import type { LinkListQuery } from "@/lib/link-list";
import { shurtlesTag, statsTag } from "./tags";

/**
 * The single definition of "expired": archived, or past its expiry moment (even if the cron hasn't
 * archived it yet). `coalesce` keeps never-expiring links (`expires_at is null`) out of it: a bare
 * comparison would be null, and `not (null)` is null too, so they'd drop out of both lists.
 */
export const isExpired = sql<boolean>`(${shurtles.archivedAt} is not null or coalesce(${shurtles.expiresAt} <= now(), false))`;

/** The user's next upcoming expiry (or null): the moment cached lists and counts go out of date. */
const nextExpiry =
  sql<Date | null>`min(${shurtles.expiresAt}) filter (where ${shurtles.archivedAt} is null and ${shurtles.expiresAt} > now())`.mapWith(
    shurtles.expiresAt,
  );

/**
 * The built-in "minutes" profile (stale 5 min, revalidate 1 min, expire 1 h), cut short so the entry
 * expires when the user's next link does. Without this, a link that expires naturally (nothing to
 * call `updateTag`) would stay under Active, with stale counts, until the cache ran out.
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

export type ShurtleStats = {
  totalShurtles: number;
  /** Shurtles that have not expired. */
  activeShurtles: number;
  expiredShurtles: number;
  totalHits: number;
};

export type DailyClicks = {
  /** UTC calendar day, `YYYY-MM-DD`. */
  date: string;
  clicks: number;
};

async function getStatsByUserId(userId: string): Promise<ShurtleStats> {
  "use cache";
  cacheTag(statsTag(userId));

  const [row] = await db
    .select({
      totalShurtles: sql<number>`count(*)::int`,
      activeShurtles: sql<number>`(count(*) filter (where not ${isExpired}))::int`,
      expiredShurtles: sql<number>`(count(*) filter (where ${isExpired}))::int`,
      totalHits: sql<number>`coalesce(sum(${shurtles.hits}), 0)::int`,
      nextExpiry,
    })
    .from(shurtles)
    .where(eq(shurtles.userId, userId));

  cacheLife(minutesProfileUntil(row?.nextExpiry ?? null));
  return {
    totalShurtles: row?.totalShurtles ?? 0,
    activeShurtles: row?.activeShurtles ?? 0,
    expiredShurtles: row?.expiredShurtles ?? 0,
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
    .innerJoin(shurtles, eq(shurtles.slug, shurtleHits.slug))
    .where(and(eq(shurtles.userId, userId), gte(shurtleHits.at, since)))
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
      .select()
      .from(shurtles)
      .where(where)
      // Active: newest first. Expired: most recently expired first.
      .orderBy(
        ...(status === "expired" ? [desc(shurtles.expiresAt)] : []),
        desc(shurtles.createdAt),
        shurtles.slug,
      )
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.$count(shurtles, where),
    db.select({ nextExpiry }).from(shurtles).where(eq(shurtles.userId, userId)),
  ]);

  cacheLife(minutesProfileUntil(upcoming?.nextExpiry ?? null));
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

const resolveSlugPrepared = db
  .select({ url: shurtles.url, expired: isExpired })
  .from(shurtles)
  .where(eq(shurtles.slug, sql.placeholder("slug")))
  .limit(1)
  .prepare("resolveSlug");

/** Look up a short link: `null` when the slug doesn't exist, otherwise its destination and state. */
export async function resolveSlug(
  slug: string,
): Promise<{ url: string; expired: boolean } | null> {
  const [row] = await resolveSlugPrepared.execute({ slug });
  return row ?? null;
}

function parseCoordinate(value: string | undefined) {
  const parsed = value === undefined ? Number.NaN : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Record a visit. Runs in the background after the redirect is sent; never throws. */
export async function recordHit(slug: string, geo: Geo) {
  const longitude = parseCoordinate(geo.longitude);
  const latitude = parseCoordinate(geo.latitude);

  try {
    await db.transaction(async (tx) => {
      await tx.insert(shurtleHits).values({
        slug,
        country: geo.country,
        region: geo.countryRegion,
        city: geo.city,
        coordinates:
          longitude !== null && latitude !== null
            ? { x: longitude, y: latitude }
            : null,
      });

      await tx
        .update(shurtles)
        .set({ hits: sql`${shurtles.hits} + 1`, lastHitAt: sql`now()` })
        .where(eq(shurtles.slug, slug));
    });
  } catch (error) {
    logger.error({ err: error, slug }, "failed to record hit");
  }
}
