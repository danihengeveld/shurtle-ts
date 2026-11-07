import "server-only";

import { geoBounds, geoContains, geoEqualEarth, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import isoCountries from "i18n-iso-countries";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";

/*
 * The world map's country outlines, projected once per server instance and rendered as plain SVG
 * paths: no map library or shape data reaches the browser.
 */

export const MAP_WIDTH = 960;

type CountryProperties = { name: string };

/** Shapes without an ISO numeric id in Natural Earth, keyed by the code visits report instead. */
const UNCODED: Record<string, string> = {
  Kosovo: "XK",
  "N. Cyprus": "CY",
  Somaliland: "SO",
};

/** Antarctica takes a fifth of the map and gets no clicks worth showing. */
const LEFT_OUT = new Set(["AQ"]);

export type CountryShape = {
  /** ISO 3166-1 alpha-2, matching `hits.country`. Two shapes can share one (Cyprus, Somalia). */
  code: string;
  name: string;
  d: string;
};

export type WorldGeometry = {
  width: number;
  height: number;
  countries: CountryShape[];
};

function alpha2Of(shape: Feature<Geometry, CountryProperties>) {
  if (shape.id !== undefined) {
    return isoCountries.numericToAlpha2(shape.id) ?? null;
  }
  return UNCODED[shape.properties.name] ?? null;
}

function load() {
  const topology = world as unknown as Topology<{
    countries: GeometryCollection<CountryProperties>;
  }>;
  const all = feature(
    topology,
    topology.objects.countries,
  ) as FeatureCollection<Geometry, CountryProperties>;

  const shapes = all.features.flatMap((shape) => {
    const code = alpha2Of(shape);
    return code && !LEFT_OUT.has(code) ? [{ code, shape }] : [];
  });
  const shown: FeatureCollection = {
    type: "FeatureCollection",
    features: shapes.map(({ shape }) => shape),
  };

  // Equal Earth keeps areas true to size, so a big country doesn't look busier than it is.
  const projection = geoEqualEarth().fitWidth(MAP_WIDTH, shown);
  const [, [, bottom]] = geoPath(projection).bounds(shown);
  return { shapes, projection, height: Math.ceil(bottom) };
}

let loaded: ReturnType<typeof load> | undefined;
let geometry: WorldGeometry | undefined;

export function worldGeometry() {
  loaded ??= load();
  if (!geometry) {
    const { shapes, projection, height } = loaded;
    const path = geoPath(projection).digits(1);
    geometry = {
      width: MAP_WIDTH,
      height,
      countries: shapes.flatMap(({ code, shape }) => {
        const d = path(shape);
        return d ? [{ code, name: shape.properties.name, d }] : [];
      }),
    };
  }
  return geometry;
}

export type WorldDot = { x: number; y: number; code: string };

const dotMaps = new Map<
  number,
  { width: number; height: number; dots: WorldDot[] }
>();

/**
 * The same world as a hexagonal grid of dots, `spacing` apart (in map units), each one knowing its
 * country: a lighter map for small, decorative uses (a few hundred circles instead of paths).
 */
export function worldDots(spacing: number) {
  const cached = dotMaps.get(spacing);
  if (cached) return cached;

  loaded ??= load();
  const { shapes, projection, height } = loaded;
  // Check a point against a country's bounding box first: far cheaper than the polygon test.
  const candidates = shapes.map(({ code, shape }) => {
    const [[west, south], [east, north]] = geoBounds(shape);
    return { code, shape, west, south, east, north };
  });

  const dots: WorldDot[] = [];
  const rowHeight = spacing * (Math.sqrt(3) / 2);
  for (let row = 0, y = spacing / 2; y < height; row++, y += rowHeight) {
    for (
      let x = row % 2 === 0 ? spacing / 2 : spacing;
      x < MAP_WIDTH;
      x += spacing
    ) {
      const point = projection.invert?.([x, y]);
      if (!point) continue;
      const [lon, lat] = point;
      const country = candidates.find(
        ({ shape, west, south, east, north }) =>
          lat >= south &&
          lat <= north &&
          // A box that crosses the antimeridian (Russia, Fiji) has west > east.
          (west <= east
            ? lon >= west && lon <= east
            : lon >= west || lon <= east) &&
          geoContains(shape, point),
      );
      if (country) dots.push({ x, y, code: country.code });
    }
  }

  const map = { width: MAP_WIDTH, height, dots };
  dotMaps.set(spacing, map);
  return map;
}
