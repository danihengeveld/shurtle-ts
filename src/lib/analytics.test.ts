import { describe, expect, it } from "vitest";
import {
  DEFAULT_RANGE,
  MAX_RECENT_PAGE,
  analyticsHref,
  analyticsWindow,
  bucketKey,
  bucketKeys,
  bucketStart,
  parseAnalyticsQuery,
  peakOf,
  percentOf,
  shadeScale,
  splitPrevious,
  zeroFill,
} from "./analytics";

const NOW = Date.UTC(2026, 10, 7, 14, 25, 30); // Sat Nov 7 2026, 14:25:30 UTC
const CREATED = new Date(Date.UTC(2026, 9, 2, 9, 0, 0)); // Oct 2

describe("parseAnalyticsQuery", () => {
  it("defaults to the last 30 days and the first page", () => {
    expect(parseAnalyticsQuery({})).toEqual({ range: "30d", page: 1 });
    expect(DEFAULT_RANGE).toBe("30d");
  });

  it("accepts every known range and nothing else", () => {
    for (const range of ["24h", "7d", "30d", "90d", "all"]) {
      expect(parseAnalyticsQuery({ range }).range).toBe(range);
    }
    for (const range of ["1y", "ALL", "", "30", "7D"]) {
      expect(parseAnalyticsQuery({ range }).range).toBe("30d");
    }
    expect(parseAnalyticsQuery({ range: ["7d", "24h"] }).range).toBe("7d");
  });

  it("clamps the page to a sane positive integer", () => {
    expect(parseAnalyticsQuery({ page: "3" }).page).toBe(3);
    expect(parseAnalyticsQuery({ page: "0" }).page).toBe(1);
    expect(parseAnalyticsQuery({ page: "-2" }).page).toBe(1);
    expect(parseAnalyticsQuery({ page: "abc" }).page).toBe(1);
    expect(parseAnalyticsQuery({ page: "1e9" }).page).toBe(1);
    expect(parseAnalyticsQuery({ page: "999999" }).page).toBe(MAX_RECENT_PAGE);
  });
});

describe("analyticsHref", () => {
  it("leaves out defaults", () => {
    expect(analyticsHref("/dashboard/links/x", {})).toBe("/dashboard/links/x");
    expect(analyticsHref("/dashboard/links/x", { range: "30d", page: 1 })).toBe(
      "/dashboard/links/x",
    );
    expect(analyticsHref("/demo", { range: "7d", page: 2 }, "recent")).toBe(
      "/demo?range=7d&page=2#recent",
    );
  });
});

describe("analyticsWindow", () => {
  it("covers the last 24 hours in hours, ending with the current one", () => {
    const window = analyticsWindow("24h", NOW, CREATED);
    expect(window).toEqual({
      range: "24h",
      bucket: "hour",
      start: "2026-11-06T15:00:00.000Z",
      end: "2026-11-07T15:00:00.000Z",
      previousStart: "2026-11-05T15:00:00.000Z",
    });
    expect(bucketKeys(window.start, window.end, "hour")).toHaveLength(24);
  });

  it("covers 7 days in hours and 30 or 90 days in days, including today", () => {
    const week = analyticsWindow("7d", NOW, CREATED);
    expect(week.bucket).toBe("hour");
    expect(bucketKeys(week.start, week.end, "hour")).toHaveLength(168);

    const month = analyticsWindow("30d", NOW, CREATED);
    expect(month).toMatchObject({
      bucket: "day",
      start: "2026-10-09T00:00:00.000Z",
      end: "2026-11-08T00:00:00.000Z",
      previousStart: "2026-09-09T00:00:00.000Z",
    });
    const days = bucketKeys(month.start, month.end, "day");
    expect(days).toHaveLength(30);
    expect(days.at(-1)).toBe("2026-11-07");

    expect(
      bucketKeys(
        analyticsWindow("90d", NOW, CREATED).start,
        analyticsWindow("90d", NOW, CREATED).end,
        "day",
      ),
    ).toHaveLength(90);
  });

  it("runs all time from the day the link was created, with nothing to compare to", () => {
    const window = analyticsWindow("all", NOW, CREATED);
    expect(window).toEqual({
      range: "all",
      bucket: "day",
      start: "2026-10-02T00:00:00.000Z",
      end: "2026-11-08T00:00:00.000Z",
      previousStart: null,
    });
    // A link created today still gets one day.
    const today = analyticsWindow("all", NOW, new Date(NOW - 60_000));
    expect(bucketKeys(today.start, today.end, "day")).toEqual(["2026-11-07"]);
  });
});

describe("buckets", () => {
  it("keys hours and days in UTC and reads them back", () => {
    const date = new Date(Date.UTC(2026, 0, 5, 3, 59));
    expect(bucketKey(date, "hour")).toBe("2026-01-05T03");
    expect(bucketKey(date, "day")).toBe("2026-01-05");
    expect(bucketStart("2026-01-05T03").toISOString()).toBe(
      "2026-01-05T03:00:00.000Z",
    );
    expect(bucketStart("2026-01-05").toISOString()).toBe(
      "2026-01-05T00:00:00.000Z",
    );
  });

  it("zero-fills a window and ignores counts outside it", () => {
    const window = {
      start: "2026-11-05T00:00:00.000Z",
      end: "2026-11-08T00:00:00.000Z",
      bucket: "day" as const,
    };
    expect(
      zeroFill(
        [
          { bucket: "2026-11-06", clicks: 4 },
          { bucket: "2026-11-01", clicks: 9 },
        ],
        window,
      ),
    ).toEqual([
      { bucket: "2026-11-05", clicks: 0 },
      { bucket: "2026-11-06", clicks: 4 },
      { bucket: "2026-11-07", clicks: 0 },
    ]);
  });

  it("splits off the previous period", () => {
    const window = analyticsWindow("7d", NOW, CREATED);
    const result = splitPrevious(
      [
        { bucket: "2026-10-30T10", clicks: 2 }, // the week before
        { bucket: "2026-10-31T14", clicks: 3 }, // its last hour
        { bucket: "2026-10-31T15", clicks: 1 }, // this week's first hour
        { bucket: "2026-11-07T14", clicks: 5 }, // this hour
      ],
      window,
    );
    expect(result.previousTotal).toBe(5);
    expect(result.total).toBe(6);
    expect(result.series).toHaveLength(168);
    expect(result.series[0]).toEqual({ bucket: "2026-10-31T15", clicks: 1 });
    expect(result.series.at(-1)).toEqual({ bucket: "2026-11-07T14", clicks: 5 });

    const all = splitPrevious([], analyticsWindow("all", NOW, CREATED));
    expect(all.previousTotal).toBeNull();
  });
});

describe("peakOf", () => {
  it("is the busiest bucket, the latest on a tie, or null without clicks", () => {
    expect(peakOf([])).toBeNull();
    expect(peakOf([{ bucket: "a", clicks: 0 }])).toBeNull();
    expect(
      peakOf([
        { bucket: "a", clicks: 3 },
        { bucket: "b", clicks: 7 },
        { bucket: "c", clicks: 7 },
        { bucket: "d", clicks: 1 },
      ]),
    ).toEqual({ bucket: "c", clicks: 7 });
  });
});

describe("shadeScale", () => {
  it("shades by rank, darkest for the most clicks", () => {
    const shade = shadeScale([1000, 3, 2, 1, 0]);
    expect(shade(0)).toBe(0);
    expect(shade(1)).toBe(2);
    expect(shade(2)).toBe(3);
    expect(shade(3)).toBe(4);
    // One dominant country doesn't wash out the others: rank, not size.
    expect(shade(1000)).toBe(5);
  });

  it("gives a single country the darkest shade and spreads many over all five", () => {
    expect(shadeScale([12])(12)).toBe(5);
    const many = Array.from({ length: 20 }, (_, index) => index + 1);
    const shade = shadeScale(many);
    expect(new Set(many.map(shade))).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(shade(1)).toBe(1);
  });

  it("treats counts it wasn't given as no clicks", () => {
    expect(shadeScale([5])(6)).toBe(0);
  });
});

describe("percentOf", () => {
  it("rounds to whole percentages but never hides a click as 0%", () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(1, 1000)).toBe(1);
    expect(percentOf(0, 10)).toBe(0);
    expect(percentOf(5, 0)).toBe(0);
  });
});
