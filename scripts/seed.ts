/**
 * Fills the local development database with links and clicks for one user, so every dashboard and
 * analytics state can be seen: busy and quiet links, one expiring soon, one renewable, one released,
 * one without clicks yet. The clicks follow the same patterns as the public demo
 * (src/lib/demo-analytics.ts): a launch, a spike, daytime peaks, quieter weekends and a few bots.
 *
 *   pnpm db:seed user_2abc...   (your Clerk user id, from the Clerk dashboard under Users)
 *
 * Reads POSTGRES_URL from the environment or .env.development.local, never .env.local, and refuses
 * to touch anything but a database on this machine. Running it again replaces that user's links.
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { existsSync } from "node:fs";
import { shurtleHits, shurtles } from "../src/server/db/schema.ts";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = Date.now();

if (existsSync(".env.development.local")) {
  process.loadEnvFile(".env.development.local");
}

const url = process.env.POSTGRES_URL;
const userId = process.argv[2] ?? process.env.SEED_USER_ID;

if (!url || !LOCAL_HOSTS.has(new URL(url).hostname)) {
  console.error(
    "POSTGRES_URL must point at the local database (see .env.example). The seed never runs against a remote one.",
  );
  process.exit(1);
}
if (!userId) {
  console.error(
    "Pass your Clerk user id: pnpm db:seed user_... (find it in the Clerk dashboard under Users).",
  );
  process.exit(1);
}

/** Small, seedable PRNG (mulberry32), so every run produces the same clicks relative to now. */
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
const next = random(42);

function weighted<T>(items: readonly (readonly [T, number])[]) {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  let pick = next() * total;
  for (const [item, weight] of items) {
    pick -= weight;
    if (pick < 0) return item;
  }
  return items[items.length - 1][0];
}

type Place = [
  country: string,
  offset: number,
  [city: string, region: string][],
];

const PLACES: readonly (readonly [Place, number])[] = [
  [
    [
      "US",
      -6,
      [
        ["New York", "NY"],
        ["San Francisco", "CA"],
        ["Austin", "TX"],
        ["Chicago", "IL"],
      ],
    ],
    30,
  ],
  [
    [
      "NL",
      1,
      [
        ["Amsterdam", "NH"],
        ["Utrecht", "UT"],
        ["Rotterdam", "ZH"],
      ],
    ],
    14,
  ],
  [
    [
      "DE",
      1,
      [
        ["Berlin", "BE"],
        ["Munich", "BY"],
        ["Hamburg", "HH"],
      ],
    ],
    9,
  ],
  [
    [
      "GB",
      0,
      [
        ["London", "ENG"],
        ["Manchester", "ENG"],
        ["Edinburgh", "SCT"],
      ],
    ],
    9,
  ],
  [
    [
      "FR",
      1,
      [
        ["Paris", "IDF"],
        ["Lyon", "ARA"],
      ],
    ],
    5,
  ],
  [
    [
      "CA",
      -5,
      [
        ["Toronto", "ON"],
        ["Vancouver", "BC"],
      ],
    ],
    5,
  ],
  [
    [
      "IN",
      5.5,
      [
        ["Bengaluru", "KA"],
        ["Mumbai", "MH"],
      ],
    ],
    5,
  ],
  [["BR", -3, [["São Paulo", "SP"]]], 3],
  [
    [
      "JP",
      9,
      [
        ["Tokyo", "13"],
        ["Osaka", "27"],
      ],
    ],
    3,
  ],
  [
    [
      "AU",
      10,
      [
        ["Sydney", "NSW"],
        ["Melbourne", "VIC"],
      ],
    ],
    3,
  ],
  [["SE", 1, [["Stockholm", "AB"]]], 2],
  [
    [
      "ES",
      1,
      [
        ["Madrid", "MD"],
        ["Barcelona", "CT"],
      ],
    ],
    2,
  ],
  [["SG", 8, [["Singapore", "01"]]], 1],
  [["ZA", 2, [["Cape Town", "WC"]]], 0.8],
  [["NZ", 12, [["Auckland", "AUK"]]], 0.4],
];

const REFERRERS: readonly (readonly [string | null, number])[] = [
  [null, 30],
  ["x.com", 16],
  ["linkedin.com", 12],
  ["google.com", 8],
  ["news.ycombinator.com", 7],
  ["reddit.com", 6],
  ["slack.com", 5],
  ["github.com", 4],
  ["bsky.app", 2],
  ["mail.google.com", 2],
];

type Device = "mobile" | "tablet" | "desktop" | "other";
type Software = [device: Device, os: string, browsers: [string, number][]];

const SOFTWARE: readonly (readonly [Software, number])[] = [
  [
    [
      "mobile",
      "iOS",
      [
        ["Safari", 8],
        ["Chrome", 2],
      ],
    ],
    30,
  ],
  [
    [
      "mobile",
      "Android",
      [
        ["Chrome", 8],
        ["Samsung Internet", 2],
      ],
    ],
    23,
  ],
  [
    [
      "desktop",
      "macOS",
      [
        ["Chrome", 5],
        ["Safari", 3],
        ["Firefox", 1],
        ["Arc", 1],
      ],
    ],
    20,
  ],
  [
    [
      "desktop",
      "Windows",
      [
        ["Chrome", 6],
        ["Edge", 3],
        ["Firefox", 1],
      ],
    ],
    15,
  ],
  [
    [
      "desktop",
      "Linux",
      [
        ["Firefox", 2],
        ["Chrome", 2],
      ],
    ],
    3,
  ],
  [["tablet", "iOS", [["Safari", 1]]], 5],
  [["other", "Android", [["Chrome", 1]]], 0.6],
];

/** Crawlers and link previews: stored like the proxy stores them, without a place. */
const BOTS: readonly (readonly [Software, number])[] = [
  [["other", "Linux", [["Slackbot", 1]]], 3],
  [["desktop", "Linux", [["Googlebot", 1]]], 2],
  [["other", "Linux", [["Twitterbot", 1]]], 2],
  [["desktop", "macOS", [["curl", 1]]], 1],
];

/** Local hour of a click: quiet at night, busy late morning and evening. */
const LOCAL_HOURS = [
  1.5, 0.8, 0.5, 0.4, 0.4, 0.6, 1.5, 3, 5, 6.5, 7, 7, 6, 6.5, 6.5, 6, 5.5, 5,
  4.5, 5, 6, 5.5, 4, 2.5,
].map((weight, hour) => [hour, weight] as const);

type LinkSeed = {
  slug: string;
  url: string;
  /** Days ago the link was created. */
  age: number;
  /** Hours from now the link expires (negative: already expired). */
  expiresIn?: number;
  /** Released early: archived 24 hours after expiry, as the daily cron would. */
  released?: boolean;
  /** Human clicks on day `day` of the link's life (0 = the day it was created). */
  clicks: (day: number, weekend: boolean) => number;
};

const LINKS: LinkSeed[] = [
  {
    // Busy and long-lived: a launch, a Hacker News spike around day 52, a steady tail.
    slug: "hello",
    url: "https://example.com/blog/introducing-our-new-app",
    age: 118,
    clicks: (day, weekend) =>
      110 * Math.exp(-day / 2.2) +
      (day >= 52 && day <= 56 ? 170 * Math.exp(-(day - 52) / 0.9) : 0) +
      12 * (weekend ? 0.6 : 1) * (0.75 + next() * 0.5),
  },
  {
    slug: "docs",
    url: "https://example.com/docs/getting-started",
    age: 64,
    expiresIn: 14 * 24,
    clicks: (_, weekend) => (weekend ? 1 : 6) * (0.5 + next()),
  },
  {
    // Expires within the hour: the dashboard counts down and moves it to Expired on its own.
    slug: "conf-talk",
    url: "https://example.com/talks/fast-redirects-slides.pdf",
    age: 21,
    expiresIn: 0.75,
    clicks: (day) => (day < 3 ? 40 / (day + 1) : 2 * next()),
  },
  {
    // Clicked only in its first two weeks: empty recent windows, a full "all time".
    slug: "newsletter",
    url: "https://example.com/newsletter/issue-12",
    age: 80,
    clicks: (day) => (day < 14 ? 30 * Math.exp(-day / 3) : 0),
  },
  {
    // Created minutes ago, no clicks yet.
    slug: "fresh",
    url: "https://example.com/careers/frontend-engineer",
    age: 0.01,
    clicks: () => 0,
  },
  {
    // Expired a few hours ago: still in the renewal window, renewable from the Expired list.
    slug: "spring-sale",
    url: "https://example.com/shop/spring-sale",
    age: 40,
    expiresIn: -5,
    clicks: (_, weekend) => (weekend ? 14 : 8) * (0.5 + next()),
  },
  {
    // Expired a month ago and released: anyone can claim the slug, the history stays.
    slug: "winter-promo",
    url: "https://example.com/shop/winter-promo",
    age: 100,
    expiresIn: -30 * 24,
    released: true,
    clicks: (day) => 20 * Math.exp(-day / 15) + 2 * next(),
  },
];

type Hit = typeof shurtleHits.$inferInsert;

function hitsFor(
  link: LinkSeed,
  shurtleId: string,
  createdAt: number,
  end: number,
) {
  const hits: Hit[] = [];
  const firstDay = Math.floor(createdAt / DAY) * DAY;
  for (
    let dayStart = firstDay, day = 0;
    dayStart < end;
    dayStart += DAY, day++
  ) {
    const weekday = new Date(dayStart).getUTCDay();
    const count = Math.round(link.clicks(day, weekday === 0 || weekday === 6));
    // Roughly one visit in twenty-five is a bot or a link preview.
    const bots = next() < count / 25 ? 1 + Math.floor(next() * 2) : 0;
    for (let index = 0; index < count + bots; index++) {
      const isBot = index >= count;
      const [country, offset, cities] = weighted(PLACES);
      const hour = weighted(LOCAL_HOURS);
      const at = dayStart + (hour - offset) * HOUR + Math.floor(next() * HOUR);
      if (at < createdAt || at >= end) continue;
      const [device, os, browsers] = weighted(isBot ? BOTS : SOFTWARE);
      const [city, region] = cities[Math.floor(next() * cities.length)];
      // A few visits come without a city, or without any location.
      const located = !isBot && next() >= 0.015;
      const hasCity = next() >= 0.04;
      hits.push({
        shurtleId,
        at: new Date(at),
        country: located ? country : null,
        region: located ? region : null,
        city: located && hasCity ? city : null,
        referrer: isBot ? null : weighted(REFERRERS),
        device,
        browser: weighted(browsers),
        os,
        isBot,
      });
    }
  }
  return hits;
}

const db = drizzle(url);

const deleted = await db
  .delete(shurtles)
  .where(eq(shurtles.userId, userId))
  .returning({ id: shurtles.id });
if (deleted.length) console.log(`Removed ${deleted.length} existing links.`);

for (const link of LINKS) {
  const createdAt = NOW - link.age * DAY;
  const expiresAt =
    link.expiresIn === undefined ? null : NOW + link.expiresIn * HOUR;
  // Expired links stop redirecting, so they stop collecting clicks.
  const end = expiresAt === null ? NOW : Math.min(NOW, expiresAt);

  const [{ id }] = await db
    .insert(shurtles)
    .values({
      slug: link.slug,
      url: link.url,
      userId,
      createdAt: new Date(createdAt),
      expiresAt: expiresAt === null ? null : new Date(expiresAt),
      archivedAt:
        link.released && expiresAt !== null ? new Date(expiresAt + DAY) : null,
    })
    .returning({ id: shurtles.id });

  const hits = hitsFor(link, id, createdAt, end);
  // Stay well under Postgres' 65,535 bind parameters per statement.
  for (let start = 0; start < hits.length; start += 2_000) {
    await db.insert(shurtleHits).values(hits.slice(start, start + 2_000));
  }

  const human = hits.filter((hit) => !hit.isBot);
  const lastHitAt = human.reduce<Date | null>(
    (last, hit) => (last && last > hit.at! ? last : hit.at!),
    null,
  );
  await db
    .update(shurtles)
    .set({ hits: human.length, lastHitAt })
    .where(eq(shurtles.id, id));

  console.log(
    `${link.slug.padEnd(14)} ${String(human.length).padStart(5)} clicks, ${hits.length - human.length} bots`,
  );
}

await db.$client.end();
console.log(`Seeded ${LINKS.length} links for ${userId}.`);
