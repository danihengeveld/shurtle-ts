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
    expect(niceMax(21)).toBe(40);
    expect(niceMax(200)).toBe(250);
  });
});
