import { describe, expect, it } from "vitest";
import { URL_MAX_LENGTH, createShurtleSchema } from "./schemas";

const tomorrow = () => new Date(Date.now() + 86_400_000).toISOString();

describe("createShurtleSchema", () => {
  it("accepts a minimal submission and treats empty optional fields as absent", () => {
    const result = createShurtleSchema.parse({
      url: "https://example.com/a",
      slug: "",
      expiresAt: "",
    });
    expect(result).toEqual({
      url: "https://example.com/a",
      slug: undefined,
      expiresAt: undefined,
    });
  });

  it("adds https:// when the scheme is missing", () => {
    expect(
      createShurtleSchema.parse({ url: "  example.com/page?x=1 " }).url,
    ).toBe("https://example.com/page?x=1");
  });

  it("rejects non-web schemes, bare words and over-long URLs", () => {
    for (const url of [
      "ftp://example.com",
      "javascript:alert(1)",
      "not a url",
      "",
      `https://example.com/${"a".repeat(URL_MAX_LENGTH)}`,
    ]) {
      expect(createShurtleSchema.safeParse({ url }).success, url).toBe(false);
    }
  });

  it("accepts URLs longer than 255 characters", () => {
    const url = `https://example.com/${"a".repeat(400)}`;
    expect(createShurtleSchema.safeParse({ url }).success).toBe(true);
  });

  it("blocks links back to Shurtle and localhost, including subdomains and paths", () => {
    for (const url of [
      "https://shurtle.app",
      "https://shurtle.app/abc",
      "https://www.shurtle.app/",
      "http://localhost:3000/x",
    ]) {
      expect(createShurtleSchema.safeParse({ url }).success, url).toBe(false);
    }
  });

  it("validates custom slugs", () => {
    expect(
      createShurtleSchema.safeParse({
        url: "https://example.com",
        slug: "my-link",
      }).success,
    ).toBe(true);
    expect(
      createShurtleSchema.safeParse({
        url: "https://example.com",
        slug: "Dashboard",
      }).success,
    ).toBe(false);
    expect(
      createShurtleSchema.safeParse({
        url: "https://example.com",
        slug: "has space",
      }).success,
    ).toBe(false);
  });

  it("requires a future expiration date with an offset", () => {
    expect(
      createShurtleSchema.safeParse({
        url: "https://example.com",
        expiresAt: tomorrow(),
      }).success,
    ).toBe(true);
    expect(
      createShurtleSchema.safeParse({
        url: "https://example.com",
        expiresAt: "2001-01-01T00:00:00Z",
      }).success,
    ).toBe(false);
    expect(
      createShurtleSchema.safeParse({
        url: "https://example.com",
        expiresAt: "tomorrow",
      }).success,
    ).toBe(false);
  });
});
