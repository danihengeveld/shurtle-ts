/**
 * Editing a link's destination against a real Postgres: only the owner, only while the link holds
 * its slug, and never onto a URL another of their unreleased links already goes to. Runs only with
 * TEST_DATABASE_URL pointing at a local throwaway database (see analytics.db.test.ts). It uses a
 * database of its own on that server, so it can run alongside the other database tests.
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

const TEST_DB = "shurtle_mutations_test";
const session = vi.hoisted(() => ({ userId: "user_a" }));

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth", () => ({
  requireUserId: async () => session.userId,
}));
vi.mock("@/server/db", async () => {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  // Unset when the suite is skipped: drizzle only connects on the first query.
  const target = URL.parse(process.env.TEST_DATABASE_URL ?? "");
  if (target) target.pathname = "/shurtle_mutations_test";
  return { db: drizzle(target?.toString() ?? "") };
});

const LIVE = "00000000-0000-4000-8000-000000000001";
const RENEWABLE = "00000000-0000-4000-8000-000000000002";
const RELEASED = "00000000-0000-4000-8000-000000000003";
const OTHER = "00000000-0000-4000-8000-000000000004";
const THEIRS = "00000000-0000-4000-8000-000000000005";
const OLD = "00000000-0000-4000-8000-000000000006";
const MISSING = "00000000-0000-4000-8000-0000000000ff";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

describe.skipIf(!runnable)("editing a link's destination", async () => {
  const { Client } = await import("pg");
  const admin = new Client({ connectionString: url });
  // The mock above: node-postgres, with the pool and schema push the app's `Database` type hides.
  const { db } = (await import("@/server/db")) as unknown as {
    db: import("drizzle-orm/node-postgres").NodePgDatabase & {
      $client: import("pg").Pool;
    };
  };
  const schema = await import("@/server/db/schema");
  const { setOwnShurtleUrl } = await import("./mutations");
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
    // `end()` can resolve while the pool's connections are still closing; the forced drop below
    // then terminates them (57P01), which would surface as an unhandled error. Expected here.
    db.$client.on("error", () => {});
    await db.$client.end();
    await admin.query(`drop database if exists ${TEST_DB} with (force)`);
    await admin.end();
  });

  beforeEach(async () => {
    session.userId = "user_a";
    const now = Date.now();
    await db.delete(schema.shurtles);
    await db.insert(schema.shurtles).values([
      {
        id: LIVE,
        slug: "live",
        url: "https://example.com/a",
        userId: "user_a",
        hits: 3,
      },
      {
        id: RENEWABLE,
        slug: "renewable",
        url: "https://example.com/b",
        userId: "user_a",
        expiresAt: new Date(now - HOUR),
      },
      {
        id: RELEASED,
        slug: "released",
        url: "https://example.com/c",
        userId: "user_a",
        expiresAt: new Date(now - 2 * DAY),
      },
      {
        id: OTHER,
        slug: "other",
        url: "https://example.com/d",
        userId: "user_a",
      },
      {
        id: THEIRS,
        slug: "theirs",
        url: "https://example.com/e",
        userId: "user_b",
      },
      {
        id: OLD,
        slug: "old",
        url: "https://example.com/f",
        userId: "user_a",
        expiresAt: new Date(now - 30 * DAY),
        archivedAt: new Date(now - 29 * DAY),
      },
    ]);
  });

  const urlOf = async (id: string) =>
    (
      await db
        .select({
          url: schema.shurtles.url,
          slug: schema.shurtles.slug,
          hits: schema.shurtles.hits,
        })
        .from(schema.shurtles)
        .where(eq(schema.shurtles.id, id))
    )[0];

  it("changes a live link's destination, keeping its slug and clicks", async () => {
    expect(await setOwnShurtleUrl(LIVE, "https://example.com/new")).toEqual({
      status: "updated",
      slug: "live",
      url: "https://example.com/new",
    });
    expect(await urlOf(LIVE)).toEqual({
      url: "https://example.com/new",
      slug: "live",
      hits: 3,
    });
  });

  it("allows saving the destination it already has", async () => {
    expect(await setOwnShurtleUrl(LIVE, "https://example.com/a")).toMatchObject(
      {
        status: "updated",
      },
    );
  });

  it("changes a renewable link, which still holds its slug", async () => {
    expect(
      await setOwnShurtleUrl(RENEWABLE, "https://example.com/new"),
    ).toMatchObject({
      status: "updated",
      slug: "renewable",
    });
  });

  it("refuses a link whose renewal window is over, released or not", async () => {
    expect(await setOwnShurtleUrl(RELEASED, "https://example.com/new")).toEqual(
      {
        status: "released",
      },
    );
    expect(await setOwnShurtleUrl(OLD, "https://example.com/new")).toEqual({
      status: "released",
    });
    expect((await urlOf(RELEASED))?.url).toBe("https://example.com/c");
  });

  it("treats someone else's link as missing and leaves it alone", async () => {
    expect(await setOwnShurtleUrl(THEIRS, "https://example.com/new")).toEqual({
      status: "not-found",
    });
    expect(await setOwnShurtleUrl(MISSING, "https://example.com/new")).toEqual({
      status: "not-found",
    });
    expect((await urlOf(THEIRS))?.url).toBe("https://example.com/e");
  });

  it("refuses a URL another of the user's unreleased links goes to", async () => {
    expect(await setOwnShurtleUrl(LIVE, "https://example.com/d")).toEqual({
      status: "url-taken",
      slug: "other",
    });
    // Renewable links still count: they keep their place in the unique index.
    expect(await setOwnShurtleUrl(LIVE, "https://example.com/b")).toEqual({
      status: "url-taken",
      slug: "renewable",
    });
    expect((await urlOf(LIVE))?.url).toBe("https://example.com/a");
  });

  it("allows a URL used by a released link, or by another user", async () => {
    expect(await setOwnShurtleUrl(LIVE, "https://example.com/f")).toMatchObject(
      {
        status: "updated",
      },
    );
    expect(
      await setOwnShurtleUrl(OTHER, "https://example.com/e"),
    ).toMatchObject({
      status: "updated",
    });
  });

  it("reports the unique index as url-taken when the pre-check is raced", async () => {
    // Simulates a concurrent edit: the select runs before the other link takes the URL.
    const spy = vi.spyOn(db, "select").mockImplementationOnce((() => ({
      from: () => ({
        where: () => ({
          limit: async () => {
            await db
              .update(schema.shurtles)
              .set({ url: "https://example.com/raced" })
              .where(eq(schema.shurtles.id, OTHER));
            return [];
          },
        }),
      }),
    })) as never);
    try {
      expect(await setOwnShurtleUrl(LIVE, "https://example.com/raced")).toEqual(
        {
          status: "url-taken",
          slug: "other",
        },
      );
    } finally {
      spy.mockRestore();
    }
  });
});
