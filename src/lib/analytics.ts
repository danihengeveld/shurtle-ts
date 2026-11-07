/**
 * Link analytics: time ranges, the windows they cover and the buckets their charts use. Pure and
 * client-safe. Everything is in UTC, like the dashboard's daily clicks.
 */

import type { DeviceType } from "./visit";

export const ANALYTICS_RANGES = ["24h", "7d", "30d", "90d", "all"] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];
export const DEFAULT_RANGE: AnalyticsRange = "30d";

export const RANGE_LABELS: Record<
  AnalyticsRange,
  { short: string; long: string }
> = {
  "24h": { short: "24h", long: "Last 24 hours" },
  "7d": { short: "7d", long: "Last 7 days" },
  "30d": { short: "30d", long: "Last 30 days" },
  "90d": { short: "90d", long: "Last 90 days" },
  all: { short: "All", long: "All time" },
};

/** Recent clicks per page. */
export const RECENT_CLICKS_PER_PAGE = 10;
/** Bounds the query offset and the number of distinct cache entries. */
export const MAX_RECENT_PAGE = 1_000;

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export type Bucket = "hour" | "day";

/**
 * The span a range covers: `[start, end)`, aligned to its buckets, so the last bucket is the current
 * hour or day. Plain ISO strings, so a window can be a cache key.
 */
export type AnalyticsWindow = {
  range: AnalyticsRange;
  bucket: Bucket;
  start: string;
  end: string;
  /** The span of the same length right before, for the change in clicks; null for all time. */
  previousStart: string | null;
};

export type LinkAnalyticsSearchParams = {
  range?: string | string[];
  page?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse untrusted search params into a range and a page of recent clicks. */
export function parseAnalyticsQuery(params: LinkAnalyticsSearchParams) {
  const rawRange = first(params.range);
  const range = (ANALYTICS_RANGES as readonly string[]).includes(rawRange ?? "")
    ? (rawRange as AnalyticsRange)
    : DEFAULT_RANGE;
  const page = Number.parseInt(first(params.page) ?? "", 10);
  return {
    range,
    page:
      Number.isSafeInteger(page) && page > 0
        ? Math.min(page, MAX_RECENT_PAGE)
        : 1,
  };
}

/** Href for a range and page, leaving out defaults. */
export function analyticsHref(
  pathname: string,
  {
    range = DEFAULT_RANGE,
    page = 1,
  }: { range?: AnalyticsRange; page?: number },
  hash?: string,
) {
  const params = new URLSearchParams();
  if (range !== DEFAULT_RANGE) params.set("range", range);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return `${pathname}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`;
}

function startOfUtcHour(ms: number) {
  return Math.floor(ms / HOUR_MS) * HOUR_MS;
}

function startOfUtcDay(ms: number) {
  return Math.floor(ms / DAY_MS) * DAY_MS;
}

const RANGE_BUCKETS: Record<
  Exclude<AnalyticsRange, "all">,
  { bucket: Bucket; count: number }
> = {
  "24h": { bucket: "hour", count: 24 },
  "7d": { bucket: "hour", count: 7 * 24 },
  "30d": { bucket: "day", count: 30 },
  "90d": { bucket: "day", count: 90 },
};

/**
 * The window a range covers at `now`. All time starts on the day the link was created; it has no
 * previous period to compare with.
 */
export function analyticsWindow(
  range: AnalyticsRange,
  now: number,
  createdAt: Date,
): AnalyticsWindow {
  if (range === "all") {
    const end = startOfUtcDay(now) + DAY_MS;
    const start = Math.min(startOfUtcDay(createdAt.getTime()), end - DAY_MS);
    return {
      range,
      bucket: "day",
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
      previousStart: null,
    };
  }

  const { bucket, count } = RANGE_BUCKETS[range];
  const size = bucket === "hour" ? HOUR_MS : DAY_MS;
  const end =
    (bucket === "hour" ? startOfUtcHour(now) : startOfUtcDay(now)) + size;
  const start = end - count * size;
  return {
    range,
    bucket,
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    previousStart: new Date(start - count * size).toISOString(),
  };
}

/** A bucket's key: `2026-11-07T14` for an hour, `2026-11-07` for a day (UTC). */
export function bucketKey(date: Date, bucket: Bucket) {
  const iso = date.toISOString();
  return bucket === "hour" ? iso.slice(0, 13) : iso.slice(0, 10);
}

/** The moment a bucket key starts. */
export function bucketStart(key: string) {
  return new Date(key.length === 13 ? `${key}:00:00Z` : `${key}T00:00:00Z`);
}

/** Every bucket key from `start` (inclusive) to `end` (exclusive), oldest first. */
export function bucketKeys(start: string, end: string, bucket: Bucket) {
  const size = bucket === "hour" ? HOUR_MS : DAY_MS;
  const keys: string[] = [];
  for (let ms = Date.parse(start); ms < Date.parse(end); ms += size) {
    keys.push(bucketKey(new Date(ms), bucket));
  }
  return keys;
}

export type ClicksPoint = { bucket: string; clicks: number };

/** Clicks per bucket for the whole window, oldest first, with zeros where nobody clicked. */
export function zeroFill(
  counts: Iterable<ClicksPoint>,
  { start, end, bucket }: Pick<AnalyticsWindow, "start" | "end" | "bucket">,
): ClicksPoint[] {
  const byKey = new Map<string, number>();
  for (const { bucket: key, clicks } of counts) byKey.set(key, clicks);
  return bucketKeys(start, end, bucket).map((key) => ({
    bucket: key,
    clicks: byKey.get(key) ?? 0,
  }));
}

/** The busiest bucket (the latest one on a tie), or null when nobody clicked. */
export function peakOf(series: ClicksPoint[]) {
  let peak: ClicksPoint | null = null;
  for (const point of series) {
    if (point.clicks > 0 && (!peak || point.clicks >= peak.clicks)) {
      peak = point;
    }
  }
  return peak;
}

/*
 * What the analytics page shows. A source provides it: the database for the signed-in owner's
 * links (src/server/analytics.ts), or generated sample data for the public demo.
 */

/** The link the page is about. */
export type AnalyticsLink = {
  id: string;
  slug: string;
  url: string;
  /** Clicks by people, all time. */
  hits: number;
  createdAt: Date;
  lastHitAt: Date | null;
  expiresAt: Date | null;
  /** Released early: its slug is no longer reserved (see src/lib/link-lifecycle.ts). */
  archived: boolean;
};

export type ClicksOverTime = {
  /** Clicks per bucket across the window, oldest first, zero-filled. */
  series: ClicksPoint[];
  total: number;
  /** Clicks in the period of the same length right before; null for all time. */
  previousTotal: number | null;
};

/** Where a click came from, as recorded: ISO 3166-1 alpha-2 country, region code and city. */
export type ClickPlace = {
  country: string | null;
  region: string | null;
  city: string | null;
};

export type LastClick = (ClickPlace & { at: Date }) | null;

export type CountryClicks = { country: string | null; clicks: number };
export type CityClicks = ClickPlace & { city: string; clicks: number };

export type Locations = {
  /** Every country, most clicks first; `country: null` when it couldn't be told. */
  countries: CountryClicks[];
  /** The top cities, most clicks first. */
  cities: CityClicks[];
  total: number;
};

/**
 * A recorded visit. `device` is null for visits recorded before devices and sources were: their
 * source is unknown, not direct.
 */
export type RecentClick = ClickPlace & {
  id: string;
  at: Date;
  referrer: string | null;
  device: DeviceType | null;
  browser: string | null;
  os: string | null;
};

export type RecentClicks = {
  clicks: RecentClick[];
  total: number;
  page: number;
  pageCount: number;
};

export type AnalyticsSource = {
  clicksOverTime(window: AnalyticsWindow): Promise<ClicksOverTime>;
  lastClick(): Promise<LastClick>;
  locations(window: AnalyticsWindow): Promise<Locations>;
  recentClicks(window: AnalyticsWindow, page: number): Promise<RecentClicks>;
};

/** Split a series that starts with the previous period into the window and the previous total. */
export function splitPrevious(
  counts: ClicksPoint[],
  window: AnalyticsWindow,
): ClicksOverTime {
  const startKey = bucketKey(new Date(window.start), window.bucket);
  let previousTotal = 0;
  const current: ClicksPoint[] = [];
  for (const point of counts) {
    if (point.bucket < startKey) previousTotal += point.clicks;
    else current.push(point);
  }
  const series = zeroFill(current, window);
  return {
    series,
    total: series.reduce((sum, point) => sum + point.clicks, 0),
    previousTotal: window.previousStart === null ? null : previousTotal,
  };
}

export const SHADES = 5;
export type Shade = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Sorts counts into shades for a map or heatmap: 0 for none, then 1 (fewest) to 5 (most) by rank
 * among the distinct counts, not by size. One country with most of the clicks would otherwise
 * leave every other one in the palest shade. The highest count always gets the darkest shade.
 */
export function shadeScale(counts: Iterable<number>) {
  const distinct = [...new Set([...counts].filter((count) => count > 0))].sort(
    (a, b) => a - b,
  );
  const shades = new Map(
    distinct.map((count, index) => [
      count,
      Math.ceil(((index + 1) / distinct.length) * SHADES) as Shade,
    ]),
  );
  return (count: number): Shade => shades.get(count) ?? 0;
}

/** Share of `part` in `total` as a whole percentage, never rounding a non-zero share down to 0. */
export function percentOf(part: number, total: number) {
  if (total <= 0 || part <= 0) return 0;
  return Math.max(1, Math.round((part / total) * 100));
}
