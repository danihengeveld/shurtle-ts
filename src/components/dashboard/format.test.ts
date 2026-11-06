import { describe, expect, it } from "vitest";
import { addLocalDays, atLocalTime, toTimeValue } from "./format";

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
