import { describe, expect, it } from "vitest";
import { analyticsWindow } from "./analytics";
import { demoAnalytics } from "./demo-analytics";

const NOW = Date.UTC(2026, 10, 7, 14, 25, 30);

describe("demoAnalytics", () => {
  it("only adds clicks as the day goes on, never changes the ones already shown", async () => {
    const window = (now: number, createdAt: Date) =>
      analyticsWindow("all", now, createdAt);
    const shownAt = async (now: number) => {
      const { link, source } = demoAnalytics(now);
      const pages = [];
      const first = await source.recentClicks(window(now, link.createdAt), 1);
      for (let page = 1; page <= first.pageCount; page++) {
        pages.push(
          ...(await source.recentClicks(window(now, link.createdAt), page))
            .clicks,
        );
      }
      return { link, clicks: pages };
    };

    const earlier = await shownAt(Date.UTC(2026, 10, 7, 9, 0, 0));
    const later = await shownAt(NOW);
    expect(later.link.createdAt).toEqual(earlier.link.createdAt);
    expect(later.link.hits).toBeGreaterThan(earlier.link.hits);
    // Newest first: everything shown at 9:00 is still there, unchanged, after the newer clicks.
    expect(later.clicks.slice(-earlier.clicks.length)).toEqual(earlier.clicks);
  });

  it("adds up the same way in every section", async () => {
    const { link, source } = demoAnalytics(NOW);
    expect(link.hits).toBeGreaterThan(2_000);

    const all = analyticsWindow("all", NOW, link.createdAt);
    const clicks = await source.clicksOverTime(all);
    expect(clicks.total).toBe(link.hits);

    const month = analyticsWindow("30d", NOW, link.createdAt);
    const [overTime, places, cells, sources, devices, recent] =
      await Promise.all([
        source.clicksOverTime(month),
        source.locations(month),
        source.weekHours(month),
        source.sources(month),
        source.devices(month),
        source.recentClicks(month, 1),
      ]);
    const total = overTime.total;
    expect(total).toBeGreaterThan(0);
    expect(overTime.previousTotal).toBeGreaterThan(0);
    expect(places.total).toBe(total);
    expect(cells.reduce((sum, cell) => sum + cell.clicks, 0)).toBe(total);
    expect(sources.reduce((sum, row) => sum + row.clicks, 0)).toBe(total);
    expect(devices.total).toBe(total);
    expect(recent.total).toBe(total);
    expect(recent.clicks).toHaveLength(10);
  });

  it("never shows a click from the future or before the link existed", async () => {
    const { link, source } = demoAnalytics(NOW);
    const recent = await source.recentClicks(
      analyticsWindow("all", NOW, link.createdAt),
      1,
    );
    expect(recent.clicks[0].at.getTime()).toBeLessThan(NOW);
    const last = await source.lastClick();
    expect(last!.at.getTime()).toBeLessThan(NOW);
    expect(link.createdAt.getTime()).toBeLessThan(NOW);
  });
});
