import { describe, expect, it } from "vitest";
import {
  addLocalDays,
  atLocalTime,
  formatAgo,
  formatClock,
  formatCount,
  formatHour,
  formatRelative,
  formatTimeLeft,
  getExpiryStatus,
  getTrend,
  splitUrl,
  toTimeValue,
} from "./format";

const NOW = Date.UTC(2026, 10, 7, 12, 0, 0);
const DAY = 86_400_000;

describe("formatHour", () => {
  it("names hours with plain spaces, the same on every ICU version", () => {
    expect(formatHour(0)).toBe("12 AM");
    expect(formatHour(9)).toBe("9 AM");
    expect(formatHour(12)).toBe("12 PM");
    expect(formatHour(23)).toBe("11 PM");
  });
});

describe("formatAgo", () => {
  it("is compact and falls back to the date after a month", () => {
    expect(formatAgo(new Date(NOW - 20_000), NOW)).toBe("just now");
    expect(formatAgo(new Date(NOW - 5 * 60_000), NOW)).toBe("5m ago");
    expect(formatAgo(new Date(NOW - 3 * 3_600_000), NOW)).toBe("3h ago");
    expect(formatAgo(new Date(NOW - 4 * DAY), NOW)).toBe("4d ago");
    expect(formatAgo(new Date(NOW - 40 * DAY), NOW, "UTC")).toBe("Sep 28");
    expect(formatAgo(new Date(Date.UTC(2025, 5, 1)), NOW, "UTC")).toBe(
      "Jun 1, 2025",
    );
  });
});

describe("formatCount", () => {
  it("groups below 100k and goes compact from there", () => {
    expect(formatCount(1284)).toBe("1,284");
    expect(formatCount(99_999)).toBe("99,999");
    expect(formatCount(100_000)).toBe("100K");
    expect(formatCount(4_230_000)).toBe("4.2M");
  });
});

describe("formatRelative", () => {
  it("rounds anything under 45 seconds to now", () => {
    expect(formatRelative(new Date(NOW - 44_000), NOW)).toBe("just now");
    expect(formatRelative(new Date(NOW + 44_000), NOW)).toBe("in a moment");
  });

  it("picks the largest whole unit, past and future", () => {
    expect(formatRelative(new Date(NOW - 46_000), NOW)).toBe("1 minute ago");
    expect(formatRelative(new Date(NOW - 5 * 3_600_000), NOW)).toBe(
      "5 hours ago",
    );
    expect(formatRelative(new Date(NOW - DAY), NOW)).toBe("yesterday");
    expect(formatRelative(new Date(NOW + 3 * DAY), NOW)).toBe("in 3 days");
    expect(formatRelative(new Date(NOW - 400 * DAY), NOW)).toBe("last year");
  });
});

describe("getExpiryStatus", () => {
  it("classifies by time remaining", () => {
    expect(getExpiryStatus(null, NOW).kind).toBe("never");
    expect(getExpiryStatus(new Date(NOW), NOW).kind).toBe("expired");
    expect(getExpiryStatus(new Date(NOW + 7 * DAY - 1), NOW).kind).toBe("soon");
    expect(getExpiryStatus(new Date(NOW + 7 * DAY), NOW).kind).toBe("later");
  });
});

describe("formatTimeLeft", () => {
  it("rounds down to hours and minutes", () => {
    expect(formatTimeLeft(17 * 3_600_000 + 5 * 60_000 + 59_000)).toBe("17h 5m");
    expect(formatTimeLeft(3 * 3_600_000)).toBe("3h");
    expect(formatTimeLeft(42 * 60_000 + 30_000)).toBe("42m");
  });

  it("never shows zero minutes while time remains", () => {
    expect(formatTimeLeft(59_999)).toBe("under a minute");
    expect(formatTimeLeft(-5)).toBe("under a minute");
  });
});

describe("formatClock", () => {
  it("counts down in h:mm:ss, rounding up", () => {
    expect(formatClock(17 * 3_600_000 + 42 * 60_000 + 8_001)).toBe("17:42:09");
    expect(formatClock(999)).toBe("0:00:01");
    expect(formatClock(0)).toBe("0:00:00");
    expect(formatClock(-1000)).toBe("0:00:00");
  });
});

describe("getTrend", () => {
  it("handles empty, new and flat periods", () => {
    expect(getTrend(0, 0)).toEqual({ kind: "none" });
    expect(getTrend(5, 0)).toEqual({ kind: "new" });
    expect(getTrend(1000, 1001)).toEqual({ kind: "flat" });
  });

  it("reports rounded percentages", () => {
    expect(getTrend(15, 10)).toEqual({ kind: "up", percent: 50 });
    expect(getTrend(1, 3)).toEqual({ kind: "down", percent: 67 });
  });
});

describe("splitUrl", () => {
  it("drops www and a bare root path", () => {
    expect(splitUrl("https://www.example.com/")).toEqual({
      host: "example.com",
      rest: "",
    });
    expect(splitUrl("https://example.com/a?b=1#c")).toEqual({
      host: "example.com",
      rest: "/a?b=1#c",
    });
  });

  it("falls back to the raw string for invalid URLs", () => {
    expect(splitUrl("not a url")).toEqual({ host: "not a url", rest: "" });
  });
});

describe("atLocalTime", () => {
  it("sets the local time of day in whole seconds (DB precision 0)", () => {
    const result = atLocalTime(new Date(2026, 10, 13, 9, 30, 12, 345), "20:45");
    expect(result).toEqual(new Date(2026, 10, 13, 20, 45, 0, 0));
  });

  it("rejects missing or malformed times", () => {
    const day = new Date(2026, 10, 13);
    for (const time of ["", "8:45", "24:00", "12:60", "12:30:00", "noon"]) {
      expect(atLocalTime(day, time)).toBeNull();
    }
  });

  it("round-trips with toTimeValue", () => {
    const date = new Date(2026, 0, 2, 7, 5);
    expect(toTimeValue(date)).toBe("07:05");
    expect(atLocalTime(date, toTimeValue(date))).toEqual(date);
  });
});

describe("addLocalDays", () => {
  it("keeps the local wall-clock time", () => {
    const start = new Date(2026, 9, 20, 14, 30);
    const later = addLocalDays(start, 14); // crosses the EU/US DST change in late Oct / early Nov
    expect([later.getDate(), later.getHours(), later.getMinutes()]).toEqual([
      3, 14, 30,
    ]);
  });
});
