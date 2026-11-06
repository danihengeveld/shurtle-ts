import { describe, expect, it } from "vitest";
import {
  isReservedSlug,
  isValidSlug,
  SLUG_HTML_PATTERN,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
} from "./slugs";

describe("isValidSlug", () => {
  it.each([
    "abc",
    "x7Kp2q",
    "my-link",
    "my_link",
    "A",
    "a".repeat(SLUG_MAX_LENGTH),
  ])("accepts %s", (slug) => {
    expect(isValidSlug(slug)).toBe(true);
  });

  it.each([
    "",
    "a".repeat(SLUG_MAX_LENGTH + 1),
    "with space",
    "dot.ted",
    "slash/ed",
    "émoji",
    "%20",
  ])("rejects %j", (slug) => {
    expect(isValidSlug(slug)).toBe(false);
  });

  it("rejects reserved app routes case-insensitively", () => {
    for (const slug of [
      "dashboard",
      "Dashboard",
      "API",
      "not-found",
      "slow-down",
      "opengraph-image",
      "_next",
    ]) {
      expect(isReservedSlug(slug)).toBe(true);
      expect(isValidSlug(slug)).toBe(false);
    }
  });

  it("allows slugs that merely start with a reserved word", () => {
    expect(isValidSlug("dashboards")).toBe(true);
    expect(isValidSlug("shurtle-launch")).toBe(true);
  });
});

describe("SLUG_HTML_PATTERN", () => {
  it("matches the same strings as SLUG_PATTERN", () => {
    const html = new RegExp(`^(?:${SLUG_HTML_PATTERN})$`, "v");
    for (const sample of ["abc", "a-b_c", "a b", "a.b", "a/b", "-", "_"]) {
      expect(html.test(sample)).toBe(SLUG_PATTERN.test(sample));
    }
  });
});
