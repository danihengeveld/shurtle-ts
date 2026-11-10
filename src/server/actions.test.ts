/**
 * The "Edit destination" action: what it lets through to the database, and what it tells the user.
 * The write itself is covered against a real Postgres in mutations.db.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  setOwnShurtleUrl: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ updateTag: mocks.updateTag }));
vi.mock("next/server", () => ({ after: () => {} }));
vi.mock("./auth", () => ({ requireUserId: async () => "user_a" }));
vi.mock("./ratelimits", () => ({ rateLimits: {} }));
vi.mock("./mutations", () => ({ setOwnShurtleUrl: mocks.setOwnShurtleUrl }));

const { setShurtleUrl } = await import("./actions");

const ID = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.setOwnShurtleUrl.mockImplementation(async (_id, url: string) => ({
    status: "updated",
    slug: "live",
    url,
  }));
});

describe("setShurtleUrl", () => {
  it("normalizes the URL like a new link's before saving it", async () => {
    expect(await setShurtleUrl(ID, "  Example.COM/Some Page ")).toEqual({
      ok: true,
      slug: "live",
      url: "https://example.com/Some%20Page",
    });
    expect(mocks.setOwnShurtleUrl).toHaveBeenCalledWith(
      ID,
      "https://example.com/Some%20Page",
    );
    expect(mocks.updateTag).toHaveBeenCalledWith("user:user_a/shurtles");
    expect(mocks.updateTag).toHaveBeenCalledWith("user:user_a/stats");
  });

  it.each([
    ["", "Enter a URL to shorten."],
    ["not a url", "Enter a valid web address"],
    ["ftp://example.com/file", "Enter a valid web address"],
    ["http://localhost:3000/x", "Enter a valid web address"],
    ["https://shurtle.app/abc", "can't point to Shurtle itself"],
    ["https://www.shurtle.app/abc", "can't point to Shurtle itself"],
    [`https://example.com/${"a".repeat(2048)}`, "at most 2048 characters"],
  ])("rejects %j without touching the database", async (url, message) => {
    const result = await setShurtleUrl(ID, url);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain(message);
    expect(mocks.setOwnShurtleUrl).not.toHaveBeenCalled();
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it("rejects an id that isn't a UUID", async () => {
    expect(await setShurtleUrl("../other", "https://example.com")).toEqual({
      ok: false,
      error: "Invalid shurtle.",
    });
    expect(mocks.setOwnShurtleUrl).not.toHaveBeenCalled();
  });

  it.each([
    [
      { status: "url-taken", slug: "other" },
      "You already shortened this URL as /other.",
    ],
    [{ status: "not-found" }, "This shurtle no longer exists."],
    [{ status: "released" }, "free for anyone to claim again"],
  ])("explains %j and leaves the caches alone", async (outcome, message) => {
    mocks.setOwnShurtleUrl.mockResolvedValueOnce(outcome);
    const result = await setShurtleUrl(ID, "https://example.com/d");
    expect(!result.ok && result.error).toContain(message);
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it("reports a database error without its details", async () => {
    mocks.setOwnShurtleUrl.mockRejectedValueOnce(new Error("connection reset"));
    expect(await setShurtleUrl(ID, "https://example.com/d")).toEqual({
      ok: false,
      error: "Something went wrong while saving. Please try again.",
    });
  });
});
