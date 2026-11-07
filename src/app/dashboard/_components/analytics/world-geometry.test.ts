import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { MAP_WIDTH, worldGeometry } = await import("./world-geometry");

describe("worldGeometry", () => {
  const geometry = worldGeometry();

  it("projects every country, without Antarctica, at the map's width", () => {
    expect(geometry.width).toBe(MAP_WIDTH);
    expect(geometry.height).toBeGreaterThan(MAP_WIDTH * 0.4);
    expect(geometry.height).toBeLessThan(MAP_WIDTH * 0.55);
    expect(geometry.countries.length).toBeGreaterThan(170);
    expect(geometry.countries.some((shape) => shape.code === "AQ")).toBe(false);
  });

  it("keys every shape by the ISO alpha-2 code visits report", () => {
    for (const shape of geometry.countries) {
      expect(shape.code).toMatch(/^[A-Z]{2}$/);
      expect(shape.d).toMatch(/^M/);
    }
    const codes = new Set(geometry.countries.map((shape) => shape.code));
    for (const code of ["NL", "US", "BR", "IN", "AU", "ZA", "XK", "GL"]) {
      expect(codes, code).toContain(code);
    }
  });

  it("is computed once", () => {
    expect(worldGeometry()).toBe(geometry);
  });
});
