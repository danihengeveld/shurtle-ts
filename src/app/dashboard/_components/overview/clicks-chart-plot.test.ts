import { describe, expect, it } from "vitest";
import { niceMax } from "./clicks-chart-plot";

describe("niceMax", () => {
  it("has a floor of 4 for small or empty series", () => {
    expect(niceMax(0)).toBe(4);
    expect(niceMax(1)).toBe(4);
  });

  it("always leaves headroom and a whole-number midpoint", () => {
    for (let max = 1; max <= 5000; max++) {
      const value = niceMax(max);
      expect(value, String(max)).toBeGreaterThanOrEqual(max * 1.1);
      expect(Number.isInteger(value / 2), String(max)).toBe(true);
    }
  });

  it("rounds to nice steps", () => {
    expect(niceMax(4)).toBe(6);
    expect(niceMax(9)).toBe(10);
    expect(niceMax(21)).toBe(30);
    expect(niceMax(94)).toBe(120);
    expect(niceMax(130)).toBe(150);
    expect(niceMax(200)).toBe(250);
  });

  it("leaves at most half again as much headroom from 20 clicks on", () => {
    // Below that, a whole-number midpoint matters more: 11 gets 20, as 15 would halve to 7.5.
    for (let max = 20; max <= 5000; max++) {
      expect(niceMax(max) / max, String(max)).toBeLessThanOrEqual(1.5);
    }
  });
});
