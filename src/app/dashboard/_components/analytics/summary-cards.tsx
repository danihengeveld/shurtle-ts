import { Skeleton } from "@/components/ui/skeleton";
import {
  bucketStart,
  peakOf,
  type AnalyticsRange,
  type AnalyticsWindow,
  type ClicksOverTime,
  type LastClick,
} from "@/lib/analytics";
import { cn } from "cn";
import {
  ClockIcon,
  FlameIcon,
  GaugeIcon,
  MousePointerClickIcon,
  SigmaIcon,
} from "lucide-react";
import {
  LOCALE,
  formatCount,
  formatDate,
  formatUtcHour,
  getTrend,
  pluralize,
} from "../format";
import { Tile, TrendNote, accentTile, tile } from "../overview/stats-cards";
import { AgoTime } from "../time";
import { Flag, placeText } from "./place";

const grid = "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4";

/** What a range's change is compared with, and what to say when neither period had clicks. */
const COMPARISON: Record<
  Exclude<AnalyticsRange, "all">,
  { none: string; previous: string }
> = {
  "24h": { none: "No clicks in the last 48 hours", previous: "the day before" },
  "7d": { none: "No clicks in the last 14 days", previous: "the week before" },
  "30d": {
    none: "No clicks in the last 60 days",
    previous: "the 30 days before",
  },
  "90d": {
    none: "No clicks in the last 180 days",
    previous: "the 90 days before",
  },
};

const utc = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...options });
const peakDay = utc({ month: "short", day: "numeric" });
const peakWeekday = utc({ weekday: "long" });
const peakHourDay = utc({ weekday: "short", month: "short", day: "numeric" });

const decimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });

function sinceText(createdAt: Date, now: number) {
  return `Since ${formatDate(createdAt, {
    timeZone: "UTC",
    withYear: new Date(now).getUTCFullYear() !== createdAt.getUTCFullYear(),
  })}`;
}

export async function SummaryCards({
  clicks,
  lastClick,
  allTimeClicks,
  createdAt,
  window,
  now,
}: {
  clicks: Promise<ClicksOverTime>;
  lastClick: Promise<LastClick>;
  allTimeClicks: number;
  createdAt: Date;
  window: AnalyticsWindow;
  /** Request time: renders the same on the server and during hydration. */
  now: number;
}) {
  const [{ series, total, previousTotal }, last] = await Promise.all([
    clicks,
    lastClick,
  ]);
  const peak = peakOf(series);
  const hourly = window.bucket === "hour";
  const days = Math.max(1, series.length);

  return (
    <div className={grid}>
      <Tile
        accent
        label="Clicks"
        icon={MousePointerClickIcon}
        value={formatCount(total)}
        footnote={
          window.range === "all" || previousTotal === null ? (
            sinceText(createdAt, now)
          ) : (
            <TrendNote
              trend={getTrend(total, previousTotal)}
              text={COMPARISON[window.range]}
            />
          )
        }
      />

      {window.range === "all" ? (
        <Tile
          label="Daily average"
          icon={GaugeIcon}
          value={decimal.format(total / days)}
          footnote={`Over ${pluralize(days, "day")}`}
        />
      ) : (
        <Tile
          label="All-time clicks"
          icon={SigmaIcon}
          value={formatCount(allTimeClicks)}
          footnote={sinceText(createdAt, now)}
        />
      )}

      <Tile
        label={hourly ? "Busiest hour" : "Busiest day"}
        icon={FlameIcon}
        value={
          peak ? (
            hourly ? (
              formatUtcHour(bucketStart(peak.bucket))
            ) : (
              peakDay.format(bucketStart(peak.bucket))
            )
          ) : (
            <Nothing />
          )
        }
        footnote={
          peak
            ? `${(hourly ? peakHourDay : peakWeekday).format(bucketStart(peak.bucket))}${hourly ? " UTC" : ""} · ${pluralize(peak.clicks, "click")}`
            : "No clicks in this range"
        }
      />

      <Tile
        label="Last click"
        icon={ClockIcon}
        value={last ? <AgoTime date={last.at} /> : <Nothing />}
        footnote={
          last ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <Flag country={last.country} />
              <span className="truncate">
                {placeText(last) ?? "Location unknown"}
              </span>
            </span>
          ) : (
            "No clicks yet"
          )
        }
      />
    </div>
  );
}

function Nothing() {
  return (
    <>
      <span aria-hidden className="text-muted-foreground/60">
        —
      </span>
      <span className="sr-only">None</span>
    </>
  );
}

export function SummaryCardsSkeleton() {
  return (
    <div className={grid} aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={cn(tile, index === 0 && accentTile)}>
          <div className="flex h-[22px] items-center">
            <Skeleton className="h-3.5 w-20" />
          </div>
          <div className="mt-auto pt-4">
            <Skeleton className="h-8 w-16 sm:h-9" />
          </div>
          <div className="mt-2 h-10 pt-1 lg:h-5">
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
