import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  percentOf,
  type Devices as DevicesData,
  type NamedClicks,
} from "@/lib/analytics";
import type { DeviceType } from "@/lib/visit";
import { cn } from "cn";
import {
  CircleHelpIcon,
  MonitorIcon,
  MonitorSmartphoneIcon,
  SmartphoneIcon,
  TabletIcon,
  type LucideIcon,
} from "lucide-react";
import { formatCount } from "../format";
import { BarList, type BarItem } from "./bar-list";
import { DevicesDonut } from "./devices-donut";
import {
  SectionCard,
  SectionEmpty,
  SectionSkeleton,
  tabsList,
  tabsTrigger,
} from "./section-card";

const TITLE = "Devices";

/**
 * Stacked in a half-width card; side by side once the card itself is wide (a full-width card on a
 * tablet), so the legend doesn't stretch across the screen.
 */
const layout = "grid @2xl:grid-cols-2 @2xl:gap-10";
const software =
  "mt-6 border-t pt-5 @2xl:mt-5 @2xl:border-t-0 @2xl:border-l @2xl:pt-0 @2xl:pl-10";

type DeviceKey = DeviceType | "unknown";

const DEVICES: Record<
  DeviceKey,
  { name: string; icon: LucideIcon; color: string; swatch: string }
> = {
  mobile: {
    name: "Phone",
    icon: SmartphoneIcon,
    color: "var(--chart-1)",
    swatch: "bg-chart-1",
  },
  desktop: {
    name: "Desktop",
    icon: MonitorIcon,
    color: "var(--chart-2)",
    swatch: "bg-chart-2",
  },
  tablet: {
    name: "Tablet",
    icon: TabletIcon,
    color: "var(--chart-3)",
    swatch: "bg-chart-3",
  },
  other: {
    name: "Other",
    icon: MonitorSmartphoneIcon,
    color: "var(--chart-4)",
    swatch: "bg-chart-4",
  },
  unknown: {
    name: "Unknown",
    icon: CircleHelpIcon,
    color: "var(--scale-0)",
    swatch: "bg-scale-0 ring-1 ring-border ring-inset",
  },
};

/** Browsers and operating systems; null names (not recorded, or unrecognised) go last as Unknown. */
function softwareItems(rows: NamedClicks[]): BarItem[] {
  const known = rows.filter((row) => row.name);
  const unknown = rows.find((row) => !row.name);
  return [
    ...known.map((row) => ({
      key: row.name!,
      clicks: row.clicks,
      label: <span className="truncate">{row.name}</span>,
    })),
    ...(unknown
      ? [
          {
            key: "unknown",
            clicks: unknown.clicks,
            muted: true,
            label: <span className="truncate">Unknown</span>,
          },
        ]
      : []),
  ];
}

/** Phone / desktop / tablet as a donut with its legend, then the top browsers and systems. */
export async function Devices({ data }: { data: Promise<DevicesData> }) {
  const { devices, browsers, os, total } = await data;

  if (total === 0) {
    return (
      <SectionCard title={TITLE}>
        <SectionEmpty
          icon={MonitorSmartphoneIcon}
          title="No clicks in this range"
        >
          Phones, desktops and the browsers people use will show up here.
        </SectionEmpty>
      </SectionCard>
    );
  }

  const split = devices
    .map((row) => ({
      key: (row.device ?? "unknown") as DeviceKey,
      clicks: row.clicks,
    }))
    // Unknown last, whatever its count.
    .sort((a, b) => Number(a.key === "unknown") - Number(b.key === "unknown"));

  return (
    <SectionCard title={TITLE} contentClassName="@container">
      <div className={layout}>
        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <DevicesDonut
            total={total}
            slices={split.map((slice) => ({
              key: slice.key,
              clicks: slice.clicks,
              color: DEVICES[slice.key].color,
            }))}
          />
          <ul aria-label="Clicks by device" className="flex-1 space-y-1">
            {split.map(({ key, clicks }) => {
              const { name, icon: Icon, swatch } = DEVICES[key];
              return (
                <li
                  key={key}
                  className={cn(
                    "flex h-8 items-center gap-2.5 text-sm",
                    key === "unknown" && "text-muted-foreground",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn("size-2.5 shrink-0 rounded-[3px]", swatch)}
                  />
                  <Icon
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="flex-1 truncate">{name}</span>
                  <span className="font-medium tabular-nums">
                    {formatCount(clicks)}
                    <span className="sr-only">
                      {" "}
                      {clicks === 1 ? "click" : "clicks"},
                    </span>
                  </span>
                  <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                    {percentOf(clicks, total)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <Tabs defaultValue="browsers" className={cn(software, "gap-4")}>
          <TabsList aria-label="Software" className={tabsList}>
            <TabsTrigger value="browsers" className={tabsTrigger}>
              Browsers
            </TabsTrigger>
            <TabsTrigger value="os" className={tabsTrigger}>
              Operating systems
            </TabsTrigger>
          </TabsList>
          <TabsContent value="browsers">
            <BarList
              items={softwareItems(browsers)}
              total={total}
              label="Clicks by browser"
              noun="browsers"
              limit={5}
            />
          </TabsContent>
          <TabsContent value="os">
            <BarList
              items={softwareItems(os)}
              total={total}
              label="Clicks by operating system"
              noun="systems"
              limit={5}
            />
          </TabsContent>
        </Tabs>
      </div>
    </SectionCard>
  );
}

export function DevicesSkeleton() {
  return (
    <SectionSkeleton title={TITLE}>
      <div className="@container">
        <div className={layout}>
          <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="relative mx-auto size-36 shrink-0 sm:size-40">
              <Skeleton className="size-full rounded-full opacity-60" />
              <div className="absolute inset-[16%] rounded-full bg-card" />
            </div>
            <div className="flex-1 space-y-1">
              {[60, 45, 30].map((width) => (
                <div key={width} className="flex h-8 items-center gap-2.5">
                  <Skeleton className="h-3.5" style={{ width: `${width}%` }} />
                  <Skeleton className="ml-auto h-3.5 w-8" />
                </div>
              ))}
            </div>
          </div>
          <div className={software}>
            <Skeleton className="h-8 w-56 rounded-lg" />
            <div className="mt-4 space-y-0.5">
              {[100, 55, 30, 18, 10].map((width) => (
                <div key={width} className="flex h-9 items-center gap-3 px-2.5">
                  <Skeleton
                    className="h-3.5"
                    style={{ width: `${width * 0.6}%` }}
                  />
                  <Skeleton className="ml-auto h-3.5 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionSkeleton>
  );
}
