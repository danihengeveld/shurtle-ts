import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locations as LocationsData } from "@/lib/analytics";
import { countryName } from "@/lib/countries";
import { MapPinOffIcon } from "lucide-react";
import { pluralize } from "../format";
import { BarList, type BarItem } from "./bar-list";
import { Flag } from "./place";
import {
  CardPill,
  SectionCard,
  SectionEmpty,
  SectionSkeleton,
} from "./section-card";
import { WorldMap } from "./world-map";
import { worldGeometry } from "./world-geometry";

const grid = "grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]";

/** Sized like the dashboard's Active / Expired tabs, a step smaller. */
const tabsList = "h-8 rounded-lg p-0.5 dark:bg-input/40";
// text-muted-foreground: shadcn's default inactive colour (foreground/60) misses AA contrast on paper.
const tabsTrigger =
  "h-7 flex-none rounded-md px-2.5 text-xs text-muted-foreground data-[state=active]:shadow-[0_1px_2px_oklch(0_0_0/0.08),0_0_0_1px_var(--border)]";

function countryItems({ countries }: LocationsData): BarItem[] {
  const items = countries.map((row): BarItem =>
    row.country
      ? {
          key: row.country,
          clicks: row.clicks,
          label: (
            <>
              <Flag country={row.country} />
              <span className="truncate">{countryName(row.country)}</span>
            </>
          ),
        }
      : {
          key: "unknown",
          clicks: row.clicks,
          muted: true,
          label: (
            <>
              <Flag country={null} />
              <span className="truncate">Unknown</span>
            </>
          ),
        },
  );
  // Unknown goes last, whatever its count: it isn't a place.
  return [
    ...items.filter((item) => !item.muted),
    ...items.filter((item) => item.muted),
  ];
}

function cityItems({ cities }: LocationsData): BarItem[] {
  return cities.map((row) => ({
    key: `${row.country}/${row.region}/${row.city}`,
    clicks: row.clicks,
    label: (
      <>
        <Flag country={row.country} />
        <span className="truncate">
          {row.city}
          {row.country && (
            <span className="text-muted-foreground">
              <span aria-hidden>{" · "}</span>
              <span className="sr-only">, </span>
              {countryName(row.country)}
            </span>
          )}
        </span>
      </>
    ),
  }));
}

/** World map with the countries and cities clicks came from. */
export async function Locations({ data }: { data: Promise<LocationsData> }) {
  const locations = await data;
  const countryCount = locations.countries.filter((row) => row.country).length;
  const empty = locations.total === 0;

  return (
    <div className={grid}>
      <SectionCard
        title="Clicks by country"
        aside={
          !empty && (
            <CardPill>
              {pluralize(countryCount, "country", "countries")}
            </CardPill>
          )
        }
      >
        <WorldMap
          countries={locations.countries}
          total={locations.total}
          className="mt-6 sm:mt-8"
        />
      </SectionCard>

      <SectionCard title="Top locations">
        {empty ? (
          <SectionEmpty icon={MapPinOffIcon} title="No places yet">
            Clicks in this range will show where they came from.
          </SectionEmpty>
        ) : (
          <Tabs defaultValue="countries" className="mt-3 gap-4">
            <TabsList aria-label="Locations" className={tabsList}>
              <TabsTrigger value="countries" className={tabsTrigger}>
                Countries
              </TabsTrigger>
              <TabsTrigger value="cities" className={tabsTrigger}>
                Cities
              </TabsTrigger>
            </TabsList>
            <TabsContent value="countries">
              <BarList
                items={countryItems(locations)}
                total={locations.total}
                label="Clicks by country"
                noun="countries"
              />
            </TabsContent>
            <TabsContent value="cities">
              {locations.cities.length === 0 ? (
                <SectionEmpty icon={MapPinOffIcon} title="No cities">
                  None of these clicks came with a city.
                </SectionEmpty>
              ) : (
                <BarList
                  items={cityItems(locations)}
                  total={locations.total}
                  label="Clicks by city"
                  noun="cities"
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </SectionCard>
    </div>
  );
}

export function LocationsSkeleton() {
  const { width, height } = worldGeometry();
  return (
    <div className={grid}>
      <SectionSkeleton title="Clicks by country">
        <div className="mt-6 sm:mt-8">
          {/* The map's own aspect ratio, so nothing shifts when it arrives. */}
          <AspectRatio ratio={width / height}>
            <Skeleton className="size-full rounded-xl opacity-60" />
          </AspectRatio>
          <div className="mt-3 h-[17px]" />
        </div>
      </SectionSkeleton>
      <SectionSkeleton title="Top locations">
        <Skeleton className="mt-3 h-8 w-36 rounded-lg" />
        <div className="mt-4 space-y-0.5">
          {[100, 72, 54, 40, 31, 22, 15, 10].map((width) => (
            <div key={width} className="flex h-9 items-center gap-3 px-2.5">
              <Skeleton
                className="h-3.5"
                style={{ width: `${width * 0.6}%` }}
              />
              <Skeleton className="ml-auto h-3.5 w-8" />
            </div>
          ))}
        </div>
      </SectionSkeleton>
    </div>
  );
}
