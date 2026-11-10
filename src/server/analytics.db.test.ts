/**
 * The analytics queries against a real Postgres: who can read a link's clicks, what counts as a
 * click, and how they're grouped. Runs only with TEST_DATABASE_URL pointing at a local throwaway
 * database (CI starts one); it drops and recreates the `shurtle` schema there.
 *
 *   docker run --rm -d --name shurtle-test-db -e POSTGRES_PASSWORD=pg -p 55432:5432 postgres:17
 *   TEST_DATABASE_URL=postgres://postgres:pg@localhost:55432/postgres pnpm test
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
// It wipes the schema: never run against anything but a local database.
const runnable = url !== undefined && LOCAL_HOSTS.has(new URL(url).hostname);

const session = vi.hoisted(() => ({ userId: "user_a" }));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));
vi.mock("@/server/auth", () => ({
  requireUserId: async () => session.userId,
}));
vi.mock("@/server/db", async () => {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  return { db: drizzle(process.env.TEST_DATABASE_URL!) };
});

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const C = "00000000-0000-4000-8000-00000000000c";
const D = "00000000-0000-4000-8000-00000000000d";
/** Monday 2 November 2026, 13:30 UTC. */
const MONDAY_1330 = Date.UTC(2026, 10, 2, 13, 30);
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const NOW = Date.now();
const ago = (ms: number) => new Date(NOW - ms);

describe.skipIf(!runnable)("link analytics queries", async () => {
  const { db } = await import("@/server/db");
  const schema = await import("@/server/db/schema");
  const { getOwnLinkAnalytics } = await import("./analytics");
  const { analyticsWindow } = await import("@/lib/analytics");
  const { sql } = await import("drizzle-orm");

  beforeAll(async () => {
    const { pushSchema } = await import("drizzle-kit/api");
    await db.execute(sql`drop schema if exists shurtle cascade`);
    await db.execute(sql`create schema shurtle`);
    await (await pushSchema(schema, db, ["shurtle"])).apply();

    await db.insert(schema.shurtles).values([
      {
        id: A,
        slug: "mine",
        url: "https://example.com/a",
        userId: "user_a",
        hits: 5,
        createdAt: ago(20 * DAY),
      },
      {
        id: B,
        slug: "theirs",
        url: "https://example.com/b",
        userId: "user_b",
        hits: 1,
        createdAt: ago(20 * DAY),
      },
      {
        id: C,
        slug: "popular",
        url: "https://example.com/c",
        userId: "user_a",
        hits: 60,
        createdAt: ago(20 * DAY),
      },
      {
        id: D,
        slug: "weekly",
        url: "https://example.com/d",
        userId: "user_a",
        hits: 1,
        createdAt: new Date(MONDAY_1330 - DAY),
      },
    ]);
    const hit = { region: null, browser: null, os: null };
    await db.insert(schema.shurtleHits).values([
      {
        ...hit,
        shurtleId: A,
        at: ago(HOUR),
        country: "NL",
        city: "Amsterdam",
        region: "NH",
        referrer: "x.com",
        device: "mobile",
        browser: "Safari",
        os: "iOS",
      },
      {
        ...hit,
        shurtleId: A,
        at: ago(2 * HOUR),
        country: "NL",
        city: "Amsterdam",
        region: "NH",
        referrer: null,
        device: "desktop",
        browser: "Chrome",
        os: "macOS",
      },
      {
        ...hit,
        shurtleId: A,
        at: ago(3 * DAY),
        country: "US",
        city: "San Francisco",
        referrer: "news.ycombinator.com",
        device: "desktop",
      },
      // Recorded before devices and sources were: unknown, not direct.
      {
        ...hit,
        shurtleId: A,
        at: ago(10 * DAY),
        country: null,
        city: null,
        referrer: null,
        device: null,
      },
      // The 30 days before.
      {
        ...hit,
        shurtleId: A,
        at: ago(35 * DAY),
        country: "DE",
        city: "Berlin",
        referrer: null,
        device: "tablet",
      },
      // A link preview: stored, never counted.
      {
        ...hit,
        shurtleId: A,
        at: ago(HOUR),
        country: null,
        city: null,
        referrer: null,
        device: "other",
        isBot: true,
      },
      // Someone else's link.
      {
        ...hit,
        shurtleId: B,
        at: ago(HOUR),
        country: "FR",
        city: "Paris",
        referrer: null,
        device: "desktop",
      },
      {
        ...hit,
        shurtleId: D,
        at: new Date(MONDAY_1330),
        country: null,
        city: null,
        referrer: null,
        device: "desktop",
      },
      // 55 referring sites, more than the list shows.
      ...Array.from({ length: 55 }, (_, index) => ({
        ...hit,
        shurtleId: C,
        at: ago(DAY),
        country: "NL",
        city: null,
        referrer: `site-${index}.example`,
        device: "desktop" as const,
      })),
    ]);
  });

  afterAll(async () => {
    await db.execute(sql`drop schema if exists shurtle cascade`);
    await db.$client.end();
  });

  const month = (createdAt: Date) => analyticsWindow("30d", NOW, createdAt);

  it("only lets the owner read a link and its clicks", async () => {
    session.userId = "user_a";
    expect(await getOwnLinkAnalytics(B)).toBeNull();
    expect(await getOwnLinkAnalytics(A)).not.toBeNull();

    session.userId = "user_b";
    expect(await getOwnLinkAnalytics(A)).toBeNull();
    session.userId = "user_a";
  });

  it("counts people's clicks over time, against the same stretch of the period before", async () => {
    const { link, source } = (await getOwnLinkAnalytics(A))!;
    expect(link).toMatchObject({ slug: "mine", hits: 5, archived: false });

    const clicks = await source.clicksOverTime(month(link.createdAt));
    expect(clicks.series).toHaveLength(30);
    expect(clicks.total).toBe(4); // not the bot, not 35 days ago
    expect(clicks.previousTotal).toBe(1);

    const day = await source.clicksOverTime(
      analyticsWindow("24h", NOW, link.createdAt),
    );
    expect(day.series).toHaveLength(24);
    expect(day.total).toBe(2);

    const last = await source.lastClick();
    expect(last).toMatchObject({ country: "NL", city: "Amsterdam" });
  });

  it("groups places, times, sources and devices", async () => {
    const { link, source } = (await getOwnLinkAnalytics(A))!;
    const window = month(link.createdAt);

    const places = await source.locations(window);
    expect(places.total).toBe(4);
    expect(places.countries).toEqual([
      { country: "NL", clicks: 2 },
      { country: "US", clicks: 1 },
      { country: null, clicks: 1 },
    ]);
    expect(places.cities[0]).toMatchObject({ city: "Amsterdam", clicks: 2 });

    const cells = await source.weekHours(window);
    expect(cells.reduce((sum, cell) => sum + cell.clicks, 0)).toBe(4);

    expect(await source.sources(window)).toEqual(
      expect.arrayContaining([
        { kind: "site", referrer: "x.com", clicks: 1 },
        { kind: "site", referrer: "news.ycombinator.com", clicks: 1 },
        { kind: "direct", clicks: 1 },
        { kind: "unknown", clicks: 1 },
      ]),
    );

    const devices = await source.devices(window);
    expect(devices.total).toBe(4);
    expect(devices.devices).toEqual(
      expect.arrayContaining([
        { device: "desktop", clicks: 2 },
        { device: "mobile", clicks: 1 },
        { device: null, clicks: 1 },
      ]),
    );
    expect(devices.browsers).toEqual(
      expect.arrayContaining([
        { name: "Safari", clicks: 1 },
        { name: null, clicks: 2 },
      ]),
    );
  });

  it("puts weekdays and hours in UTC, Monday first", async () => {
    const { link, source } = (await getOwnLinkAnalytics(D))!;
    const cells = await source.weekHours({
      ...month(link.createdAt),
      start: new Date(MONDAY_1330 - DAY).toISOString(),
      end: new Date(MONDAY_1330 + DAY).toISOString(),
    });
    expect(cells).toEqual([{ weekday: 0, hour: 13, clicks: 1 }]);
  });

  it("sums the sources past the top 50 into one row, so shares add up", async () => {
    const { link, source } = (await getOwnLinkAnalytics(C))!;
    const sources = await source.sources(month(link.createdAt));
    expect(sources).toHaveLength(51);
    expect(sources.at(-1)).toEqual({ kind: "other", clicks: 5 });
    expect(sources.reduce((sum, row) => sum + row.clicks, 0)).toBe(55);
  });

  it("pages through recent clicks, newest first", async () => {
    const { link, source } = (await getOwnLinkAnalytics(A))!;
    const window = month(link.createdAt);
    const recent = await source.recentClicks(window, 1);
    expect(recent).toMatchObject({ total: 4, page: 1, pageCount: 1 });
    expect(recent.clicks.map((click) => click.referrer)).toEqual([
      "x.com",
      null,
      "news.ycombinator.com",
      null,
    ]);
    expect(recent.clicks[3].device).toBeNull();
    expect((await source.recentClicks(window, 2)).clicks).toEqual([]);
  });
});
