import { describe, expect, it } from "vitest";
import { logoBox, QUIET_ZONE, qrCode } from "./qr-code";

describe("qrCode", () => {
  it("draws dark modules on white with a quiet zone", () => {
    const { svg, size, version } = qrCode("https://shurtle.app/abc123");
    const modules = 17 + version * 4;
    expect(size).toBe(modules + QUIET_ZONE * 2);
    expect(svg).toContain(`viewBox="0 0 ${size} ${size}"`);
    expect(svg).toContain(
      `<rect width="${size}" height="${size}" fill="#ffffff"/>`,
    );
    expect(svg).toContain('fill="#0a0a0a"');
    // Nothing is drawn in the quiet zone: the first module starts at the margin.
    const starts = [...svg.matchAll(/M(\d+) (\d+)h/g)].map(([, x, y]) => [
      Number(x),
      Number(y),
    ]);
    expect(Math.min(...starts.map(([x]) => x!))).toBe(QUIET_ZONE);
    expect(Math.min(...starts.map(([, y]) => y!))).toBe(QUIET_ZONE);
  });

  it("puts the turtle in the centre of short links", () => {
    const code = qrCode("https://shurtle.app/abc123");
    expect(code.logo).toBe(true);
    expect(code.svg).toContain('viewBox="0 2 64 36"');
  });

  it("drops the logo when the code gets too dense for it", () => {
    // At level H this needs version 8, whose centre alignment pattern the logo would cover; the
    // plain fallback uses level M, which also keeps the code less dense.
    const code = qrCode(`https://shurtle.app/${"a".repeat(64)}`);
    expect(code.logo).toBe(false);
    expect(code.version).toBeLessThan(7);
    expect(code.svg).not.toContain("64 36");
  });

  it("keeps the logo well inside level H's ~30% recovery", () => {
    for (let version = 1; version <= 6; version++) {
      const modules = 17 + version * 4;
      const { w, h } = logoBox(modules);
      expect((w * h) / modules ** 2).toBeLessThan(0.08);
    }
  });
});
