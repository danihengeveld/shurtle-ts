import { shadeScale, type CountryClicks } from "@/lib/analytics";
import { countryName } from "@/lib/countries";
import { cn } from "cn";
import { useId } from "react";
import { formatCount } from "../format";
import { SHADE_FILLS, ShadeLegend } from "./shade-legend";
import { worldGeometry } from "./world-geometry";
import { WorldMapFrame } from "./world-map-frame";

/**
 * Choropleth of clicks by country: Equal Earth projection, shaded by rank (see `shadeScale`). The
 * shapes and colours render on the server; only the tooltip runs in the browser.
 */
export function WorldMap({
  countries,
  total,
  className,
}: {
  countries: CountryClicks[];
  total: number;
  className?: string;
}) {
  const id = useId();
  const { width, height, countries: shapes } = worldGeometry();
  const clicks: Record<string, number> = {};
  for (const row of countries) {
    if (row.country) clicks[row.country.toUpperCase()] = row.clicks;
  }
  const shade = shadeScale(Object.values(clicks));
  const known = countries.filter((row) => row.country);
  const top = known
    .slice(0, 3)
    .map((row) => `${countryName(row.country!)} (${formatCount(row.clicks)})`);
  const description =
    known.length === 0
      ? "No clicks with a known country in this range."
      : `Clicks from ${known.length === 1 ? "1 country" : `${known.length} countries`}. Most from ${top.join(", ")}. The list of countries has every number.`;

  return (
    <div className={cn("flex flex-col", className)}>
      <WorldMapFrame clicks={clicks} total={total}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={`${id}-title ${id}-desc`}
          className="block h-auto w-full"
        >
          <title id={`${id}-title`}>World map of clicks by country</title>
          <desc id={`${id}-desc`}>{description}</desc>
          <g className="stroke-card [stroke-linejoin:round]" strokeWidth={0.6}>
            {shapes.map((shape, index) => (
              <path
                key={index}
                d={shape.d}
                data-country={shape.code}
                className={cn(
                  SHADE_FILLS[shade(clicks[shape.code] ?? 0)],
                  "transition-[fill,stroke] duration-150 hover:stroke-foreground/70",
                )}
              />
            ))}
          </g>
        </svg>
      </WorldMapFrame>
      <ShadeLegend className="mt-3" />
    </div>
  );
}
