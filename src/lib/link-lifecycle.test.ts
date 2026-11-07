import { describe, expect, it } from "vitest";
import {
  RENEWAL_WINDOW_MS,
  linkLifecycle,
  releaseTime,
} from "./link-lifecycle";

const NOW = Date.UTC(2026, 10, 7, 12, 0, 0);
const at = (offset: number) => new Date(NOW + offset);

describe("linkLifecycle", () => {
  it("is live until it expires, or forever without an expiry", () => {
    expect(linkLifecycle({ expiresAt: null, archived: false }, NOW).state).toBe(
      "live",
    );
    expect(
      linkLifecycle({ expiresAt: at(1), archived: false }, NOW).state,
    ).toBe("live");
  });

  it("is renewable from the moment it expires until its window ends", () => {
    expect(linkLifecycle({ expiresAt: at(0), archived: false }, NOW)).toEqual({
      state: "renewable",
      expiresAt: at(0),
      releasesAt: at(RENEWAL_WINDOW_MS),
    });
    expect(
      linkLifecycle(
        { expiresAt: at(-RENEWAL_WINDOW_MS + 1), archived: false },
        NOW,
      ).state,
    ).toBe("renewable");
  });

  it("is released once the window is over, archived or not", () => {
    expect(
      linkLifecycle({ expiresAt: at(-RENEWAL_WINDOW_MS), archived: false }, NOW)
        .state,
    ).toBe("released");
    // Released early: its owner shortened the same URL again.
    expect(
      linkLifecycle({ expiresAt: at(-1000), archived: true }, NOW).state,
    ).toBe("released");
  });
});

describe("releaseTime", () => {
  it("is 24 hours after expiry", () => {
    expect(releaseTime(at(0)).getTime() - NOW).toBe(24 * 3_600_000);
  });
});
