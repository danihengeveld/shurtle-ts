import { describe, expect, it } from "vitest";
import {
  DEFAULT_PER_PAGE,
  MAX_SEARCH_LENGTH,
  linksHref,
  parseLinkListQuery,
  statusFromPath,
} from "./link-list";

const parse = (params: Parameters<typeof parseLinkListQuery>[1]) =>
  parseLinkListQuery("active", params);

describe("parseLinkListQuery", () => {
  it("falls back to defaults", () => {
    expect(parse({})).toEqual({
      status: "active",
      page: 1,
      perPage: DEFAULT_PER_PAGE,
      query: "",
    });
  });

  it("keeps the status it is given", () => {
    expect(parseLinkListQuery("expired", {}).status).toBe("expired");
  });

  it("clamps invalid page numbers", () => {
    for (const page of ["0", "-3", "abc", "1.5e400", "9007199254740993"]) {
      expect(parse({ page }).page).toBe(1);
    }
    expect(parse({ page: "4" }).page).toBe(4);
  });

  it("only allows known page sizes", () => {
    expect(parse({ perPage: "20" }).perPage).toBe(20);
    expect(parse({ perPage: "100000" }).perPage).toBe(DEFAULT_PER_PAGE);
  });

  it("trims and bounds the search query and takes the first repeated param", () => {
    expect(parse({ q: ["  foo  ", "bar"] }).query).toBe("foo");
    expect(parse({ q: "x".repeat(500) }).query).toHaveLength(MAX_SEARCH_LENGTH);
  });
});

describe("linksHref", () => {
  it("omits defaults", () => {
    expect(linksHref({})).toBe("/dashboard");
    expect(linksHref({ page: 1, perPage: DEFAULT_PER_PAGE, query: "" })).toBe(
      "/dashboard",
    );
  });

  it("encodes non-default params", () => {
    expect(linksHref({ page: 2, perPage: 50, query: "a&b" })).toBe(
      "/dashboard?q=a%26b&page=2&perPage=50",
    );
  });

  it("puts the status in the path", () => {
    expect(linksHref({ status: "expired", page: 2 })).toBe(
      "/dashboard/expired?page=2",
    );
    expect(linksHref({ status: "expired" }, "links")).toBe(
      "/dashboard/expired#links",
    );
  });
});

describe("statusFromPath", () => {
  it("reads the status from the dashboard path", () => {
    expect(statusFromPath("/dashboard")).toBe("active");
    expect(statusFromPath("/dashboard/expired")).toBe("expired");
    expect(statusFromPath("/dashboard/expired/")).toBe("expired");
  });
});
