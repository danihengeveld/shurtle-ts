import { describe, expect, it } from "vitest";
import {
  DEFAULT_PER_PAGE,
  MAX_SEARCH_LENGTH,
  dashboardHref,
  parseDashboardQuery,
} from "./pagination";

describe("parseDashboardQuery", () => {
  it("falls back to defaults", () => {
    expect(parseDashboardQuery({})).toEqual({
      page: 1,
      perPage: DEFAULT_PER_PAGE,
      query: "",
      status: "active",
    });
  });

  it("only accepts known statuses", () => {
    expect(parseDashboardQuery({ status: "expired" }).status).toBe("expired");
    expect(parseDashboardQuery({ status: "archived" }).status).toBe("active");
  });

  it("clamps invalid page numbers", () => {
    for (const page of ["0", "-3", "abc", "1.5e400", "9007199254740993"]) {
      expect(parseDashboardQuery({ page }).page).toBe(1);
    }
    expect(parseDashboardQuery({ page: "4" }).page).toBe(4);
  });

  it("only allows known page sizes", () => {
    expect(parseDashboardQuery({ perPage: "20" }).perPage).toBe(20);
    expect(parseDashboardQuery({ perPage: "100000" }).perPage).toBe(
      DEFAULT_PER_PAGE,
    );
  });

  it("trims and bounds the search query and takes the first repeated param", () => {
    expect(parseDashboardQuery({ q: ["  foo  ", "bar"] }).query).toBe("foo");
    expect(parseDashboardQuery({ q: "x".repeat(500) }).query).toHaveLength(
      MAX_SEARCH_LENGTH,
    );
  });
});

describe("dashboardHref", () => {
  it("omits defaults", () => {
    expect(dashboardHref({})).toBe("/dashboard");
    expect(
      dashboardHref({ page: 1, perPage: DEFAULT_PER_PAGE, query: "" }),
    ).toBe("/dashboard");
  });

  it("encodes non-default params", () => {
    expect(dashboardHref({ page: 2, perPage: 50, query: "a&b" })).toBe(
      "/dashboard?q=a%26b&page=2&perPage=50",
    );
    expect(dashboardHref({ status: "expired", page: 2 })).toBe(
      "/dashboard?status=expired&page=2",
    );
  });
});
