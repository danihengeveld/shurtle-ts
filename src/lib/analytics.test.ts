import { describe, expect, it } from "vitest";
import {
  DEFAULT_RANGE,
  MAX_RECENT_PAGE,
  analyticsHref,
  analyticsWindow,
  bucketKey,
  bucketKeys,
  bucketStart,
  busiest,
  evenTicks,
  parseAnalyticsQuery,
  percentOf,
  shadeScale,
  toClicksOverTime,
  zeroFill,
} from "./analytics";

const NOW = Date.UTC(2026, 10, 7, 14, 25, 30); // Sat Nov 7 2026, 14:25:30 UTC
const CREATED = new Date(Date.UTC(2026, 9, 2, 9, 0, 0)); // Oct 2

describe("parseAnalyticsQuery", () => {
  it("defaults to the last 30 days and the first page", () => {
    expect(parseAnalyticsQuery({})).toEqual({
      range: "30d",
      page: 1,
      canonical: true,
    });
    expect(DEFAULT_RANGE).toBe("30d");
  });

  it("accepts every known range and nothing else", () => {
    for (const range of ["24h", "7d", "30d", "90d", "all"]) {
      expect(parseAnalyticsQuery({ range })).toMatchObject({
        range,
        canonical: true,
      });
    }
    for (const range of ["1y", "ALL", "", "30", "7D"]) {
      expect(parseAnalyticsQuery({ range })).toMatchObject({
        range: "30d",
        canonical: false,
      });
    }
    expect(parseAnalyticsQuery({ range: ["7d", "24h"] }).range).toBe("7d");
  });

  it("clamps the page to a sane positive integer, and says when the URL asked for another", () => {
    expect(parseAnalyticsQuery({ page: "3" })).toMatchObject({
      page: 3,
      canonical: true,
    });
    for (const page of ["0", "-2", "abc", "1e9", "03"]) {
      expect(parseAnalyticsQuery({ page }).canonical, page).toBe(false);
    }
    expect(parseAnalyticsQuery({ page: "0" }).page).toBe(1);
    expect(parseAnalyticsQuery({ page: "999999" })).toMatchObject({
      page: MAX_RECENT_PAGE,
      canonical: false,
    });
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
      // As far into the day before as now is into this one, to the minute.
      previousEnd: "2026-11-06T14:25:00.000Z",
    });
    expect(bucketKeys(window.start, window.end, "hour")).toHaveLength(24);
  });

  it("compares a period that has only just begun with the same stretch of the one before", () => {
    // 00:10 UTC: 29 days and 10 minutes into the last 30 days.
    const justAfterMidnight = Date.UTC(2026, 10, 7, 0, 10, 45);
    const month = analyticsWindow("30d", justAfterMidnight, CREATED);
    const current = justAfterMidnight - Date.parse(month.start);
    const previous =
      Date.parse(month.previousEnd!) - Date.parse(month.previousStart!);
    expect(Math.abs(current - previous)).toBeLessThan(60_000);
    expect(Date.parse(month.previousEnd!)).toBeLessThanOrEqual(
      Date.parse(month.start),
    );
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
      previousEnd: "2026-10-08T14:25:00.000Z",
    });
    const days = bucketKeys(month.start, month.end, "day");
    expect(days).toHaveLength(30);
    expect(days.at(-1)).toBe("2026-11-07");

    const quarter = analyticsWindow("90d", NOW, CREATED);
    expect(bucketKeys(quarter.start, quarter.end, "day")).toHaveLength(90);
  });

  it("runs all time from the day the link was created, with nothing to compare to", () => {
    const window = analyticsWindow("all", NOW, CREATED);
    expect(window).toEqual({
      range: "all",
      bucket: "day",
      start: "2026-10-02T00:00:00.000Z",
      end: "2026-11-08T00:00:00.000Z",
      previousStart: null,
      previousEnd: null,
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

  it("totals the window and keeps the previous period's total", () => {
    const week = analyticsWindow("7d", NOW, CREATED);
    const result = toClicksOverTime(
      [
        { bucket: "2026-10-31T15", clicks: 1 }, // this week's first hour
        { bucket: "2026-11-07T14", clicks: 5 }, // this hour
      ],
      week,
      7,
    );
    expect(result.total).toBe(6);
    expect(result.previousTotal).toBe(7);
    expect(result.series).toHaveLength(168);
    expect(result.series[0]).toEqual({ bucket: "2026-10-31T15", clicks: 1 });
    expect(result.series.at(-1)).toEqual({
      bucket: "2026-11-07T14",
      clicks: 5,
    });
  });
});

describe("busiest", () => {
  it("is the item with the most clicks, or null without clicks", () => {
    expect(busiest([])).toBeNull();
    expect(busiest([{ bucket: "a", clicks: 0 }])).toBeNull();
    expect(
      busiest([
        { bucket: "a", clicks: 3 },
        { bucket: "b", clicks: 7 },
        { bucket: "c", clicks: 1 },
      ]),
    ).toEqual({ top: { bucket: "b", clicks: 7 }, ties: 1 });
  });

  it("counts ties instead of picking one", () => {
    expect(
      busiest([
        { weekday: 0, hour: 9, clicks: 4 },
        { weekday: 1, hour: 14, clicks: 12 },
        { weekday: 4, hour: 20, clicks: 12 },
      ]),
    ).toEqual({ top: { weekday: 1, hour: 14, clicks: 12 }, ties: 2 });
  });
});

describe("evenTicks", () => {
  const days = Array.from({ length: 30 }, (_, index) => index);

  it("keeps short lists whole", () => {
    expect(evenTicks([1, 2, 3], 5)).toEqual([1, 2, 3]);
  });

  it("counts back from the last item in equal steps", () => {
    const hours = Array.from({ length: 24 }, (_, index) => index);
    expect(evenTicks(hours, 5)).toEqual([3, 8, 13, 18, 23]);
    // Hours of a day read best six apart.
    expect(evenTicks(hours, 5, 6)).toEqual([5, 11, 17, 23]);
  });

  it("puts daily labels whole weeks apart", () => {
    expect(evenTicks(days, 5, 7)).toEqual([1, 8, 15, 22, 29]);
    const quarter = Array.from({ length: 90 }, (_, index) => index);
    const ticks = evenTicks(quarter, 5, 7);
    expect(ticks.at(-1)).toBe(89);
    expect(ticks.length).toBeLessThanOrEqual(5);
    const steps = ticks.slice(1).map((tick, index) => tick - ticks[index]);
    expect(new Set(steps).size).toBe(1);
    expect(steps[0] % 7).toBe(0);
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
