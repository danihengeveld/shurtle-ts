import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  RESERVED_SLUGS,
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

describe("RESERVED_SLUGS", () => {
  /** Top-level URL segments served by src/app: folders (through route groups) and extension-less metadata routes. */
  function topLevelRoutes(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.isDirectory()) {
        if (entry.name.startsWith("_") || entry.name.startsWith(".")) return []; // private
        if (entry.name.startsWith("("))
          return topLevelRoutes(join(dir, entry.name)); // route group
        return [entry.name];
      }
      const name = entry.name.replace(/\.[^.]+$/, "");
      // Image metadata routes are served without an extension, e.g. /opengraph-image.
      return /^(opengraph-image|twitter-image|icon|apple-icon)$/.test(name)
        ? [name]
        : [];
    });
  }

  it("includes every top-level route in src/app", () => {
    const routes = topLevelRoutes(
      fileURLToPath(new URL("../app", import.meta.url)),
    );
    expect(routes).toContain("dashboard");
    for (const route of routes) {
      expect(RESERVED_SLUGS.has(route), route).toBe(true);
    }
  });
});
