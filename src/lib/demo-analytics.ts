/**
 * Sample analytics for the public demo (/demo): a made-up link with a few months of realistic
 * clicks, generated in memory. Nothing here touches the database. Each UTC day has its own sample
 * (seeded by the date), relative to that day, so the demo never looks stale; within a day, a click
 * once shown never changes.
 */

import {
  RECENT_CLICKS_PER_PAGE,
  bucketKey,
  toClicksOverTime,
  type AnalyticsLink,
  type AnalyticsSource,
  type AnalyticsWindow,
  type ClicksPoint,
  type RecentClick,
  type SourceClicks,
} from "./analytics";
import type { DeviceType } from "./visit";

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
/** How long ago the demo link was created. */
const AGE_DAYS = 118;

const DEMO_LINK_ID = "00000000-0000-4000-8000-00000000d3e0";

/** Small, fast, seedable PRNG (mulberry32). */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function weighted<T>(
  next: () => number,
  items: readonly (readonly [T, number])[],
) {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let pick = next() * total;
  for (const [item, weight] of items) {
    pick -= weight;
    if (pick < 0) return item;
  }
  return items[items.length - 1][0];
}

type Place = {
  country: string;
  /** UTC offset in hours, for local daytime peaks. */
  offset: number;
  cities: readonly (readonly [city: string, region: string, weight: number])[];
};

const PLACES: readonly (readonly [Place, number])[] = [
  [
    {
      country: "US",
      offset: -6,
      cities: [
        ["New York", "NY", 5],
        ["San Francisco", "CA", 4],
        ["Austin", "TX", 2],
        ["Seattle", "WA", 2],
        ["Chicago", "IL", 2],
        ["Boston", "MA", 1],
      ],
    },
    30,
  ],
  [
    {
      country: "NL",
      offset: 1,
      cities: [
        ["Amsterdam", "NH", 6],
        ["Utrecht", "UT", 2],
        ["Rotterdam", "ZH", 2],
        ["Eindhoven", "NB", 1],
      ],
    },
    14,
  ],
  [
    {
      country: "DE",
      offset: 1,
      cities: [
        ["Berlin", "BE", 4],
        ["Munich", "BY", 2],
        ["Hamburg", "HH", 2],
      ],
    },
    9,
  ],
  [
    {
      country: "GB",
      offset: 0,
      cities: [
        ["London", "ENG", 6],
        ["Manchester", "ENG", 1],
        ["Edinburgh", "SCT", 1],
      ],
    },
    9,
  ],
  [
    {
      country: "FR",
      offset: 1,
      cities: [
        ["Paris", "IDF", 4],
        ["Lyon", "ARA", 1],
      ],
    },
    5,
  ],
  [
    {
      country: "CA",
      offset: -5,
      cities: [
        ["Toronto", "ON", 3],
        ["Vancouver", "BC", 2],
        ["Montreal", "QC", 1],
      ],
    },
    5,
  ],
  [
    {
      country: "IN",
      offset: 5.5,
      cities: [
        ["Bengaluru", "KA", 3],
        ["Mumbai", "MH", 2],
        ["Delhi", "DL", 1],
      ],
    },
    5,
  ],
  [
    {
      country: "BR",
      offset: -3,
      cities: [
        ["São Paulo", "SP", 3],
        ["Rio de Janeiro", "RJ", 1],
      ],
    },
    3,
  ],
  [
    {
      country: "JP",
      offset: 9,
      cities: [
        ["Tokyo", "13", 3],
        ["Osaka", "27", 1],
      ],
    },
    3,
  ],
  [
    {
      country: "AU",
      offset: 10,
      cities: [
        ["Sydney", "NSW", 2],
        ["Melbourne", "VIC", 2],
      ],
    },
    3,
  ],
  [{ country: "SE", offset: 1, cities: [["Stockholm", "AB", 1]] }, 2],
  [
    {
      country: "ES",
      offset: 1,
      cities: [
        ["Madrid", "MD", 1],
        ["Barcelona", "CT", 1],
      ],
    },
    2,
  ],
  [
    {
      country: "PL",
      offset: 1,
      cities: [
        ["Warsaw", "14", 1],
        ["Kraków", "12", 1],
      ],
    },
    2,
  ],
  [
    {
      country: "BE",
      offset: 1,
      cities: [
        ["Brussels", "BRU", 1],
        ["Antwerp", "VAN", 1],
      ],
    },
    2,
  ],
  [
    {
      country: "IT",
      offset: 1,
      cities: [
        ["Milan", "MI", 1],
        ["Rome", "RM", 1],
      ],
    },
    1.5,
  ],
  [{ country: "CH", offset: 1, cities: [["Zürich", "ZH", 1]] }, 1.2],
  [{ country: "SG", offset: 8, cities: [["Singapore", "01", 1]] }, 1.2],
  [{ country: "KR", offset: 9, cities: [["Seoul", "11", 1]] }, 1],
  [{ country: "MX", offset: -6, cities: [["Mexico City", "CMX", 1]] }, 1],
  [
    {
      country: "ZA",
      offset: 2,
      cities: [
        ["Cape Town", "WC", 1],
        ["Johannesburg", "GP", 1],
      ],
    },
    0.8,
  ],
  [{ country: "NG", offset: 1, cities: [["Lagos", "LA", 1]] }, 0.6],
  [{ country: "AR", offset: -3, cities: [["Buenos Aires", "C", 1]] }, 0.6],
  [{ country: "ID", offset: 7, cities: [["Jakarta", "JK", 1]] }, 0.6],
  [{ country: "NZ", offset: 12, cities: [["Auckland", "AUK", 1]] }, 0.4],
  [{ country: "KE", offset: 3, cities: [["Nairobi", "30", 1]] }, 0.3],
];

const REFERRERS: readonly (readonly [string | null, number])[] = [
  [null, 30],
  ["x.com", 16],
  ["linkedin.com", 12],
  ["news.ycombinator.com", 7],
  ["google.com", 8],
  ["reddit.com", 6],
  ["slack.com", 5],
  ["github.com", 4],
  ["facebook.com", 2.5],
  ["bsky.app", 2],
  ["mail.google.com", 2],
  ["duckduckgo.com", 1.2],
  ["teams.microsoft.com", 1],
  ["producthunt.com", 1],
  ["dev.to", 0.6],
];

type Software = {
  device: DeviceType;
  os: string;
  browsers: readonly (readonly [string, number])[];
};

const SOFTWARE: readonly (readonly [Software, number])[] = [
  [
    {
      device: "mobile",
      os: "iOS",
      browsers: [
        ["Safari", 8],
        ["Chrome", 2],
      ],
    },
    30,
  ],
  [
    {
      device: "mobile",
      os: "Android",
      browsers: [
        ["Chrome", 8],
        ["Samsung Internet", 2],
        ["Firefox", 0.5],
      ],
    },
    23,
  ],
  [
    {
      device: "desktop",
      os: "macOS",
      browsers: [
        ["Chrome", 5],
        ["Safari", 3],
        ["Firefox", 1],
        ["Arc", 1],
      ],
    },
    20,
  ],
  [
    {
      device: "desktop",
      os: "Windows",
      browsers: [
        ["Chrome", 6],
        ["Edge", 3],
        ["Firefox", 1],
      ],
    },
    15,
  ],
  [
    {
      device: "desktop",
      os: "Linux",
      browsers: [
        ["Firefox", 2],
        ["Chrome", 2],
      ],
    },
    3,
  ],
  [{ device: "tablet", os: "iOS", browsers: [["Safari", 1]] }, 5],
  [{ device: "tablet", os: "Android", browsers: [["Chrome", 1]] }, 1.5],
  [{ device: "other", os: "Android", browsers: [["Chrome", 1]] }, 0.6],
];

/** Local hour of a click: quiet at night, busy late morning and evening. */
const LOCAL_HOURS: readonly (readonly [number, number])[] = [
  [0, 1.5],
  [1, 0.8],
  [2, 0.5],
  [3, 0.4],
  [4, 0.4],
  [5, 0.6],
  [6, 1.5],
  [7, 3],
  [8, 5],
  [9, 6.5],
  [10, 7],
  [11, 7],
  [12, 6],
  [13, 6.5],
  [14, 6.5],
  [15, 6],
  [16, 5.5],
  [17, 5],
  [18, 4.5],
  [19, 5],
  [20, 6],
  [21, 5.5],
  [22, 4],
  [23, 2.5],
];

/** Clicks on a given day of the link's life: a launch, a quiet tail, two spikes, busier weekdays. */
function clicksOnDay(day: number, weekday: number, next: () => number) {
  const launch = 220 * Math.exp(-day / 2.2);
  const hackerNews =
    day >= 52 && day <= 56 ? 340 * Math.exp(-(day - 52) / 0.9) : 0;
  const thread =
    day >= AGE_DAYS - 9 && day <= AGE_DAYS - 6
      ? 90 * Math.exp(-(day - (AGE_DAYS - 9)) / 1.2)
      : 0;
  const weekend = weekday === 5 || weekday === 6 ? 0.62 : 1;
  const baseline = 24 * weekend * (0.75 + next() * 0.5);
  return Math.round(launch + hackerNews + thread + baseline);
}

/** A UTC day's sample: the demo link's creation and every click it will have had by the day's end. */
export type DemoSample = { createdAt: Date; hits: RecentClick[] };

/**
 * Generates the sample for the UTC day `now` falls on. Each click draws all of its random values
 * whether or not it has happened yet, and the clock only filters afterwards (`demoAnalytics`), so
 * time passing reveals more clicks without changing the ones already shown. Cache it per day.
 */
export function demoSample(now: number): DemoSample {
  const today = Math.floor(now / DAY_MS) * DAY_MS;
  const next = random(today / DAY_MS);
  const createdAt = new Date(today - AGE_DAYS * DAY_MS + 9.5 * HOUR_MS);
  const hits: RecentClick[] = [];

  for (let day = 0; day <= AGE_DAYS; day++) {
    const dayStart = today - (AGE_DAYS - day) * DAY_MS;
    const weekday = (new Date(dayStart).getUTCDay() + 6) % 7;
    const count = clicksOnDay(day, weekday, next);
    const spike = day >= 52 && day <= 55;
    for (let index = 0; index < count; index++) {
      const place = weighted(next, PLACES);
      const hour = weighted(next, LOCAL_HOURS);
      const at =
        dayStart +
        (hour - place.offset) * HOUR_MS +
        Math.floor(next() * HOUR_MS);
      const [city, region] = weighted(
        next,
        place.cities.map(
          ([name, code, weight]) => [[name, code] as const, weight] as const,
        ),
      );
      const software = weighted(next, SOFTWARE);
      const referrer =
        spike && next() < 0.6
          ? "news.ycombinator.com"
          : weighted(next, REFERRERS);
      // A few visits come without a city, or without any location.
      const located = next() >= 0.012;
      const hasCity = next() >= 0.04;
      const browser = weighted(next, software.browsers);
      if (at < createdAt.getTime()) continue;
      hits.push({
        id: `demo-${day}-${index}`,
        at: new Date(at),
        country: located ? place.country : null,
        region: located ? region : null,
        city: located && hasCity ? city : null,
        referrer,
        device: software.device,
        browser,
        os: software.os,
      });
    }
  }

  hits.sort((a, b) => b.at.getTime() - a.at.getTime());
  return { createdAt, hits };
}

function count<K>(items: Iterable<K>) {
  const counts = new Map<K, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}

/** The demo link and its sample analytics as of `now`, from that day's `demoSample`. */
export function demoAnalytics(
  now: number,
  sample: DemoSample = demoSample(now),
): {
  link: AnalyticsLink;
  source: AnalyticsSource;
} {
  const { createdAt } = sample;
  const hits = sample.hits.filter((hit) => hit.at.getTime() < now);
  const between = (from: string, to: string) => {
    const start = Date.parse(from);
    const end = Date.parse(to);
    return hits.filter(
      (hit) => hit.at.getTime() >= start && hit.at.getTime() < end,
    );
  };
  const inWindow = (window: AnalyticsWindow) =>
    between(window.start, window.end);

  const source: AnalyticsSource = {
    // Same shape as the database source (src/server/analytics.ts), computed in memory.
    async clicksOverTime(window) {
      const counts = count(
        inWindow(window).map((hit) => bucketKey(hit.at, window.bucket)),
      ).map(([bucket, clicks]): ClicksPoint => ({ bucket, clicks }));
      const previousTotal =
        window.previousStart && window.previousEnd
          ? between(window.previousStart, window.previousEnd).length
          : null;
      return toClicksOverTime(counts, window, previousTotal);
    },
    async lastClick() {
      const [last] = hits;
      return last
        ? {
            at: last.at,
            country: last.country,
            region: last.region,
            city: last.city,
          }
        : null;
    },
    async locations(window) {
      const clicks = inWindow(window);
      const cities = count(
        clicks
          .filter((hit) => hit.city)
          .map((hit) => `${hit.country}|${hit.region}|${hit.city}`),
      );
      return {
        countries: count(clicks.map((hit) => hit.country)).map(
          ([country, total]) => ({
            country,
            clicks: total,
          }),
        ),
        cities: cities.slice(0, 50).map(([key, total]) => {
          const [country, region, city] = key.split("|");
          return { country, region, city, clicks: total };
        }),
        total: clicks.length,
      };
    },
    async weekHours(window) {
      return count(
        inWindow(window).map(
          (hit) => `${(hit.at.getUTCDay() + 6) % 7}|${hit.at.getUTCHours()}`,
        ),
      ).map(([key, clicks]) => {
        const [weekday, hour] = key.split("|").map(Number);
        return { weekday, hour, clicks };
      });
    },
    async sources(window) {
      return count(inWindow(window).map((hit) => hit.referrer)).map(
        ([referrer, clicks]): SourceClicks =>
          referrer
            ? { kind: "site", referrer, clicks }
            : { kind: "direct", clicks },
      );
    },
    async devices(window) {
      const clicks = inWindow(window);
      const named = (values: (string | null)[]) =>
        count(values).map(([name, total]) => ({ name, clicks: total }));
      return {
        devices: count(clicks.map((hit) => hit.device)).map(
          ([device, total]) => ({
            device,
            clicks: total,
          }),
        ),
        browsers: named(clicks.map((hit) => hit.browser)),
        os: named(clicks.map((hit) => hit.os)),
        total: clicks.length,
      };
    },
    async recentClicks(window, page) {
      const clicks = inWindow(window);
      const offset = (page - 1) * RECENT_CLICKS_PER_PAGE;
      return {
        clicks: clicks.slice(offset, offset + RECENT_CLICKS_PER_PAGE),
        total: clicks.length,
        page,
        pageCount: Math.max(
          1,
          Math.ceil(clicks.length / RECENT_CLICKS_PER_PAGE),
        ),
      };
    },
  };

  return {
    link: {
      id: DEMO_LINK_ID,
      slug: "launch",
      url: "https://example.com/blog/introducing-our-new-app",
      hits: hits.length,
      createdAt,
      lastHitAt: hits[0]?.at ?? null,
      expiresAt: null,
      archived: false,
    },
    source,
  };
}
