/**
 * Recording a click against a real Postgres: the hit and the link's counter are written in one
 * statement, together or not at all. Runs only with TEST_DATABASE_URL pointing at a local
 * throwaway database (see analytics.db.test.ts). It uses a database of its own on that server, so
 * it can run alongside the other database tests.
 */
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const url = process.env.TEST_DATABASE_URL;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
// It wipes a database: never run against anything but a local server.
const runnable = url !== undefined && LOCAL_HOSTS.has(new URL(url).hostname);

const TEST_DB = "shurtle_queries_test";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: () => {}, cacheTag: () => {} }));
vi.mock("@/server/auth", () => ({ requireUserId: async () => "user_a" }));
vi.mock("@/server/db", async () => {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  // Unset when the suite is skipped: drizzle only connects on the first query.
  const target = URL.parse(process.env.TEST_DATABASE_URL ?? "");
  if (target) target.pathname = "/shurtle_queries_test";
  return { db: drizzle(target?.toString() ?? "") };
});

const LINK = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const DELETED = "00000000-0000-4000-8000-0000000000ff";

const AMSTERDAM = { country: "NL", countryRegion: "NH", city: "Amsterdam" };
const PHONE = {
  referrer: "x.com",
  device: "mobile" as const,
  browser: "Safari",
  os: "iOS",
  isBot: false,
};

describe.skipIf(!runnable)("recording a click", async () => {
  const { Client } = await import("pg");
  const admin = new Client({ connectionString: url });
  // The mock above: node-postgres, with the pool and schema push the app's `Database` type hides.
  const { db } = (await import("@/server/db")) as unknown as {
    db: import("drizzle-orm/node-postgres").NodePgDatabase & {
      $client: import("pg").Pool;
    };
  };
  const schema = await import("@/server/db/schema");
  const { recordHit } = await import("./queries");
  const { eq, sql } = await import("drizzle-orm");

  beforeAll(async () => {
    await admin.connect();
    await admin.query(`drop database if exists ${TEST_DB} with (force)`);
    await admin.query(`create database ${TEST_DB}`);
    const { pushSchema } = await import("drizzle-kit/api");
    await db.execute(sql`create schema shurtle`);
    await (await pushSchema(schema, db, ["shurtle"])).apply();
  });

  afterAll(async () => {
    await db.$client.end();
    await admin.query(`drop database if exists ${TEST_DB} with (force)`);
    await admin.end();
  });

  beforeEach(async () => {
    await db.delete(schema.shurtles);
    await db.insert(schema.shurtles).values([
      {
        id: LINK,
        slug: "link",
        url: "https://example.com/a",
        userId: "user_a",
        hits: 3,
      },
      {
        id: OTHER,
        slug: "other",
        url: "https://example.com/b",
        userId: "user_a",
        hits: 7,
      },
    ]);
  });

  const linkOf = async (id: string) =>
    (
      await db
        .select({
          hits: schema.shurtles.hits,
          lastHitAt: schema.shurtles.lastHitAt,
        })
        .from(schema.shurtles)
        .where(eq(schema.shurtles.id, id))
    )[0];
  const hitsOf = (id: string) =>
    db
      .select()
      .from(schema.shurtleHits)
      .where(eq(schema.shurtleHits.shurtleId, id));
  const allHits = async () =>
    (
      await db
        .select({ n: sql<number>`count(*)::int` })
        .from(schema.shurtleHits)
    )[0].n;

  it("stores the hit and counts it on the link, in one go", async () => {
    await recordHit(LINK, AMSTERDAM, PHONE);

    const hits = await hitsOf(LINK);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      country: "NL",
      region: "NH",
      city: "Amsterdam",
      referrer: "x.com",
      device: "mobile",
      browser: "Safari",
      os: "iOS",
      isBot: false,
    });
    const link = await linkOf(LINK);
    expect(link.hits).toBe(4);
    expect(link.lastHitAt).not.toBeNull();
    // Only the clicked link's counter moves.
    expect((await linkOf(OTHER)).hits).toBe(7);
  });

  it("counts every click when several land at once", async () => {
    await Promise.all(
      Array.from({ length: 20 }, () => recordHit(LINK, AMSTERDAM, PHONE)),
    );

    expect(await hitsOf(LINK)).toHaveLength(20);
    expect((await linkOf(LINK)).hits).toBe(23);
  });

  it("stores a bot's visit without its place, and doesn't count it", async () => {
    await recordHit(LINK, AMSTERDAM, { ...PHONE, isBot: true });

    const hits = await hitsOf(LINK);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      isBot: true,
      country: null,
      region: null,
      city: null,
    });
    const link = await linkOf(LINK);
    expect(link.hits).toBe(3);
    expect(link.lastHitAt).toBeNull();
  });

  it("writes nothing for a link deleted a moment ago, and doesn't throw", async () => {
    await expect(recordHit(DELETED, AMSTERDAM, PHONE)).resolves.toBeUndefined();

    expect(await allHits()).toBe(0);
    expect((await linkOf(LINK)).hits).toBe(3);
    expect((await linkOf(OTHER)).hits).toBe(7);
  });
});
