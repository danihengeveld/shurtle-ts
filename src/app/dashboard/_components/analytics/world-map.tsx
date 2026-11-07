import { SHADES, shadeScale, type CountryClicks } from "@/lib/analytics";
import { countryName } from "@/lib/countries";
import { cn } from "cn";
import { useId } from "react";
import { formatCount } from "../format";
import { worldGeometry } from "./world-geometry";
import { WorldMapFrame } from "./world-map-frame";

/** Static class names, so Tailwind sees every one of them. */
const FILLS = [
  "fill-scale-0",
  "fill-scale-1",
  "fill-scale-2",
  "fill-scale-3",
  "fill-scale-4",
  "fill-scale-5",
] as const;
const SWATCHES = [
  "bg-scale-1",
  "bg-scale-2",
  "bg-scale-3",
  "bg-scale-4",
  "bg-scale-5",
] as const;

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
    <figure className={cn("flex flex-col", className)}>
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
            {shapes.map((shape, index) => {
              const level = shade(clicks[shape.code] ?? 0);
              return (
                <path
                  key={index}
                  d={shape.d}
                  data-country={shape.code}
                  className={cn(
                    FILLS[level],
                    "transition-[fill,stroke] duration-150 hover:stroke-foreground/70",
                  )}
                />
              );
            })}
          </g>
        </svg>
      </WorldMapFrame>

      {/* The map's own description says it in words; the legend is for the eye. */}
      <figcaption
        aria-hidden
        className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[11px] text-muted-foreground"
      >
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 rounded-[3px] bg-scale-0 ring-1 ring-border ring-inset"
          />
          No clicks
        </span>
        <span className="flex items-center gap-2">
          Fewer
          <span aria-hidden className="flex gap-0.5">
            {SWATCHES.slice(0, SHADES).map((swatch) => (
              <span
                key={swatch}
                className={cn(
                  "h-2.5 w-5 first:rounded-l-[3px] last:rounded-r-[3px]",
                  swatch,
                )}
              />
            ))}
          </span>
          More
        </span>
      </figcaption>
    </figure>
  );
}
