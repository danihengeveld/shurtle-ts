import "server-only";

import {
  RECENT_CLICKS_PER_PAGE,
  toClicksOverTime,
  type AnalyticsLink,
  type AnalyticsSource,
  type AnalyticsWindow,
  type Bucket,
  type ClicksOverTime,
  type Devices,
  type LastClick,
  type Locations,
  type RecentClicks,
  type SourceClicks,
  type WeekHourClicks,
} from "@/lib/analytics";
import { db } from "@/server/db";
import { shurtleHits, shurtles } from "@/server/db/schema";
import { and, desc, eq, gte, isNotNull, lt, sql, type SQL } from "drizzle-orm";
import { cacheLife } from "next/cache";
import { getOwnShurtle } from "./queries";

/*
 * Per-link analytics for the signed-in owner. `getOwnLinkAnalytics` resolves the user and checks
 * the link is theirs; the cached functions below stay private and scope every query to both the
 * link and its owner, so no caller can read another user's clicks. Bot visits are left out
 * everywhere.
 *
 * Clicks change all the time and invalidating per visit would be too frequent, so every entry
 * lives for about a minute instead (the page says it updates every minute). The windows passed in
 * change once a minute too; `lastClick` takes no window, so its short `expire` is what keeps it
 * current after the page has sat unopened.
 */
const ANALYTICS_LIFE = { stale: 60, revalidate: 60, expire: 120 };

/** The link with its analytics, or null when it doesn't exist or isn't the user's. */
export async function getOwnLinkAnalytics(
  id: string,
): Promise<{ link: AnalyticsLink; source: AnalyticsSource } | null> {
  const own = await getOwnShurtle(id);
  if (!own) return null;

  const { userId, shurtle } = own;
  const { archivedAt, ...link } = shurtle;
  return {
    link: { ...link, archived: archivedAt !== null },
    source: {
      clicksOverTime: (window) => clicksOverTime(userId, id, window),
      lastClick: () => lastClick(userId, id),
      locations: (window) => locations(userId, id, window),
      weekHours: (window) => weekHours(userId, id, window),
      sources: (window) => sources(userId, id, window),
      devices: (window) => devices(userId, id, window),
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

const clickCount = sql<number>`count(*)::int`;

/**
 * A hit's bucket key as `bucketKey` in src/lib/analytics.ts writes it. Inlined SQL rather than
 * parameters, so GROUP BY matches the select; only these fixed fragments ever get inlined.
 */
const BUCKET_KEYS: Record<Bucket, SQL<string>> = {
  hour: sql<string>`to_char(date_trunc('hour', ${shurtleHits.at} at time zone 'UTC'), 'YYYY-MM-DD"T"HH24')`,
  day: sql<string>`to_char(date_trunc('day', ${shurtleHits.at} at time zone 'UTC'), 'YYYY-MM-DD')`,
};

async function clicksOverTime(
  userId: string,
  linkId: string,
  window: AnalyticsWindow,
): Promise<ClicksOverTime> {
  "use cache";
  cacheLife(ANALYTICS_LIFE);

  const bucket = BUCKET_KEYS[window.bucket];
  const [rows, previousTotal] = await Promise.all([
    db
      .select({ bucket, clicks: clickCount })
      .from(shurtleHits)
      .where(humanHits(userId, linkId, window.start, window.end))
      .groupBy(bucket),
    window.previousStart && window.previousEnd
      ? db.$count(
          shurtleHits,
          humanHits(userId, linkId, window.previousStart, window.previousEnd),
        )
      : null,
  ]);

  return toClicksOverTime(rows, window, previousTotal);
}

async function lastClick(userId: string, linkId: string): Promise<LastClick> {
  "use cache";
  cacheLife(ANALYTICS_LIFE);

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
  cacheLife(ANALYTICS_LIFE);

  const where = humanHits(userId, linkId, window.start, window.end);
  const [countries, cities] = await Promise.all([
    db
      .select({ country: shurtleHits.country, clicks: clickCount })
      .from(shurtleHits)
      .where(where)
      .groupBy(shurtleHits.country)
      .orderBy(desc(clickCount), shurtleHits.country),
    db
      .select({
        country: shurtleHits.country,
        region: shurtleHits.region,
        city: sql<string>`${shurtleHits.city}`,
        clicks: clickCount,
      })
      .from(shurtleHits)
      .where(and(where, isNotNull(shurtleHits.city)))
      .groupBy(shurtleHits.country, shurtleHits.region, shurtleHits.city)
      .orderBy(desc(clickCount), shurtleHits.city)
      .limit(TOP_CITIES),
  ]);

  return {
    countries,
    cities,
    total: countries.reduce((sum, row) => sum + row.clicks, 0),
  };
}

async function weekHours(
  userId: string,
  linkId: string,
  window: AnalyticsWindow,
): Promise<WeekHourClicks[]> {
  "use cache";
  cacheLife(ANALYTICS_LIFE);

  const utc = sql`(${shurtleHits.at} at time zone 'UTC')`;
  // ISO weekday: Monday is 1, so Monday becomes 0.
  const weekday = sql<number>`(extract(isodow from ${utc}) - 1)::int`;
  const hour = sql<number>`extract(hour from ${utc})::int`;
  return db
    .select({ weekday, hour, clicks: clickCount })
    .from(shurtleHits)
    .where(humanHits(userId, linkId, window.start, window.end))
    .groupBy(weekday, hour)
    .orderBy(weekday, hour);
}

/** How many sources are listed; the rest are summed into one "other" row. */
const TOP_SOURCES = 50;

async function sources(
  userId: string,
  linkId: string,
  window: AnalyticsWindow,
): Promise<SourceClicks[]> {
  "use cache";
  cacheLife(ANALYTICS_LIFE);

  const where = humanHits(userId, linkId, window.start, window.end);
  // A visit without a device predates sources: unknown, not direct.
  const kind = sql<
    "site" | "direct" | "unknown"
  >`case when ${shurtleHits.device} is null then 'unknown' when ${shurtleHits.referrer} is null then 'direct' else 'site' end`;
  const [rows, total] = await Promise.all([
    db
      .select({ kind, referrer: shurtleHits.referrer, clicks: clickCount })
      .from(shurtleHits)
      .where(where)
      .groupBy(kind, shurtleHits.referrer)
      .orderBy(desc(clickCount), shurtleHits.referrer)
      .limit(TOP_SOURCES),
    db.$count(shurtleHits, where),
  ]);

  const top = rows.map(({ kind, referrer, clicks }): SourceClicks =>
    kind === "site"
      ? // The CASE above only says "site" when there is a referrer.
        { kind, referrer: referrer!, clicks }
      : { kind, clicks },
  );
  const other = total - top.reduce((sum, row) => sum + row.clicks, 0);
  return other > 0 ? [...top, { kind: "other", clicks: other }] : top;
}

/** How many browsers and operating systems are listed. */
const TOP_SOFTWARE = 20;

async function devices(
  userId: string,
  linkId: string,
  window: AnalyticsWindow,
): Promise<Devices> {
  "use cache";
  cacheLife(ANALYTICS_LIFE);

  const where = humanHits(userId, linkId, window.start, window.end);
  const top = (column: typeof shurtleHits.browser | typeof shurtleHits.os) =>
    db
      .select({ name: column, clicks: clickCount })
      .from(shurtleHits)
      .where(where)
      .groupBy(column)
      .orderBy(desc(clickCount), column)
      .limit(TOP_SOFTWARE);

  const [deviceRows, browsers, os] = await Promise.all([
    db
      .select({ device: shurtleHits.device, clicks: clickCount })
      .from(shurtleHits)
      .where(where)
      .groupBy(shurtleHits.device)
      .orderBy(desc(clickCount)),
    top(shurtleHits.browser),
    top(shurtleHits.os),
  ]);

  return {
    devices: deviceRows,
    browsers,
    os,
    total: deviceRows.reduce((sum, row) => sum + row.clicks, 0),
  };
}

async function recentClicks(
  userId: string,
  linkId: string,
  window: AnalyticsWindow,
  page: number,
): Promise<RecentClicks> {
  "use cache";
  cacheLife(ANALYTICS_LIFE);

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
