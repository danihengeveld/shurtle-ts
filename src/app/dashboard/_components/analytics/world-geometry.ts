import "server-only";

import { geoEqualEarth, geoPath } from "d3-geo";
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

function project(): WorldGeometry {
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
  const path = geoPath(projection).digits(1);
  const [, [, bottom]] = path.bounds(shown);

  return {
    width: MAP_WIDTH,
    height: Math.ceil(bottom),
    countries: shapes.flatMap(({ code, shape }) => {
      const d = path(shape);
      return d ? [{ code, name: shape.properties.name, d }] : [];
    }),
  };
}

let geometry: WorldGeometry | undefined;

export function worldGeometry() {
  geometry ??= project();
  return geometry;
}
