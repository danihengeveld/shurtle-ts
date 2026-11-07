import "server-only";

import {
  RECENT_CLICKS_PER_PAGE,
  splitPrevious,
  type AnalyticsLink,
  type AnalyticsSource,
  type AnalyticsWindow,
  type ClicksOverTime,
  type LastClick,
  type Locations,
  type RecentClicks,
} from "@/lib/analytics";
import { db } from "@/server/db";
import { shurtleHits, shurtles } from "@/server/db/schema";
import { and, desc, eq, gte, isNotNull, lt, sql, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { requireUserId } from "./auth";
import { getOwnShurtle } from "./queries";
import { analyticsTag } from "./tags";

/*
 * Per-link analytics for the signed-in owner. `getOwnLinkAnalytics` resolves the user and checks
 * the link is theirs; the cached functions below stay private and scope every query to both the
 * link and its owner, so no caller can read another user's clicks. Bot visits are left out
 * everywhere. Clicks change all the time and invalidating per visit would be too frequent, so the
 * data is cached for about a minute instead (the page says so).
 */

/** Fresh for a minute; the page says it updates every minute. */
const ANALYTICS_LIFE = { stale: 60, revalidate: 60, expire: 3600 };

/** The link with its analytics, or null when it doesn't exist or isn't the user's. */
export async function getOwnLinkAnalytics(
  id: string,
): Promise<{ link: AnalyticsLink; source: AnalyticsSource } | null> {
  const userId = await requireUserId();
  const record = await getOwnShurtle(id);
  if (!record) return null;

  const { archivedAt, ...link } = record;
  return {
    link: { ...link, archived: archivedAt !== null },
    source: {
      clicksOverTime: (window) => clicksOverTime(userId, id, window),
      lastClick: () => lastClick(userId, id),
      locations: (window) => locations(userId, id, window),
      recentClicks: (window, page) => recentClicks(userId, id, window, page),
    },
  };
}

/** Visits by people to the user's link, optionally within `[from, to)`. */
function humanHits(
  userId: string,
  linkId: string,
  from?: string,
  to?: string,
): SQL | undefined {
  return and(
    eq(shurtleHits.shurtleId, linkId),
    eq(shurtleHits.isBot, false),
    from ? gte(shurtleHits.at, new Date(from)) : undefined,
    to ? lt(shurtleHits.at, new Date(to)) : undefined,
    // Ownership, checked once per query (Postgres runs an uncorrelated EXISTS as an init plan).
    sql`exists (select 1 from ${shurtles} where ${shurtles.id} = ${linkId} and ${shurtles.userId} = ${userId})`,
  );
}

function cacheAnalytics(linkId: string) {
  cacheTag(analyticsTag(linkId));
  cacheLife(ANALYTICS_LIFE);
}

async function clicksOverTime(
  userId: string,
  linkId: string,
  window: AnalyticsWindow,
): Promise<ClicksOverTime> {
  "use cache";
  cacheAnalytics(linkId);

  const format = window.bucket === "hour" ? `YYYY-MM-DD"T"HH24` : "YYYY-MM-DD";
  const bucket = sql<string>`to_char(date_trunc(${sql.raw(`'${window.bucket}'`)}, ${shurtleHits.at} at time zone 'UTC'), ${sql.raw(`'${format}'`)})`;
  const rows = await db
    .select({ bucket, clicks: sql<number>`count(*)::int` })
    .from(shurtleHits)
    .where(
      humanHits(
        userId,
        linkId,
        window.previousStart ?? window.start,
        window.end,
      ),
    )
    .groupBy(bucket);

  return splitPrevious(rows, window);
}

async function lastClick(userId: string, linkId: string): Promise<LastClick> {
  "use cache";
  cacheAnalytics(linkId);

  const [row] = await db
    .select({
      at: shurtleHits.at,
      country: shurtleHits.country,
      region: shurtleHits.region,
      city: shurtleHits.city,
    })
    .from(shurtleHits)
    .where(humanHits(userId, linkId))
    .orderBy(desc(shurtleHits.at))
    .limit(1);
  return row ?? null;
}

/** How many cities the locations table lists. */
const TOP_CITIES = 50;

async function locations(
  userId: string,
  linkId: string,
  window: AnalyticsWindow,
): Promise<Locations> {
  "use cache";
  cacheAnalytics(linkId);

  const where = humanHits(userId, linkId, window.start, window.end);
  const clicks = sql<number>`count(*)::int`;
  const [countries, cities] = await Promise.all([
    db
      .select({ country: shurtleHits.country, clicks })
      .from(shurtleHits)
      .where(where)
      .groupBy(shurtleHits.country)
      .orderBy(desc(clicks), shurtleHits.country),
    db
      .select({
        country: shurtleHits.country,
        region: shurtleHits.region,
        city: sql<string>`${shurtleHits.city}`,
        clicks,
      })
      .from(shurtleHits)
      .where(and(where, isNotNull(shurtleHits.city)))
      .groupBy(shurtleHits.country, shurtleHits.region, shurtleHits.city)
      .orderBy(desc(clicks), shurtleHits.city)
      .limit(TOP_CITIES),
  ]);

  return {
    countries,
    cities,
    total: countries.reduce((sum, row) => sum + row.clicks, 0),
  };
}

async function recentClicks(
  userId: string,
  linkId: string,
  window: AnalyticsWindow,
  page: number,
): Promise<RecentClicks> {
  "use cache";
  cacheAnalytics(linkId);

  const where = humanHits(userId, linkId, window.start, window.end);
  const [clicks, total] = await Promise.all([
    db
      .select({
        id: shurtleHits.id,
        at: shurtleHits.at,
        country: shurtleHits.country,
        region: shurtleHits.region,
        city: shurtleHits.city,
        referrer: shurtleHits.referrer,
        device: shurtleHits.device,
        browser: shurtleHits.browser,
        os: shurtleHits.os,
      })
      .from(shurtleHits)
      .where(where)
      .orderBy(desc(shurtleHits.at), shurtleHits.id)
      .limit(RECENT_CLICKS_PER_PAGE)
      .offset((page - 1) * RECENT_CLICKS_PER_PAGE),
    db.$count(shurtleHits, where),
  ]);

  return {
    clicks,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / RECENT_CLICKS_PER_PAGE)),
  };
}
