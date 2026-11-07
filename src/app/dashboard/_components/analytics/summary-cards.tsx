import { Skeleton } from "@/components/ui/skeleton";
import {
  bucketStart,
  busiest,
  type AnalyticsRange,
  type AnalyticsWindow,
  type Bucket,
  type ClicksOverTime,
  type ClicksPoint,
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
const peakDayWithYear = utc({
  month: "short",
  day: "numeric",
  year: "numeric",
});
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
  const days = Math.max(1, series.length);

  return (
    <div className={grid}>
      <Tile
        accent
        label="Clicks"
        icon={MousePointerClickIcon}
        value={formatCount(total)}
        footnote={
          // Null exactly when the range is all time: there's no period before it.
          previousTotal === null || window.range === "all" ? (
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

      <BusiestTile series={series} bucket={window.bucket} now={now} />

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

/**
 * The busiest hour or day. When several share the top count (one click each, say), there is no
 * busiest one, and picking any of them would mislead: it says so instead.
 */
function BusiestTile({
  series,
  bucket,
  now,
}: {
  series: ClicksPoint[];
  bucket: Bucket;
  now: number;
}) {
  const peak = busiest(series);
  const hourly = bucket === "hour";
  const unit = hourly ? "hour" : "day";
  const start = peak && bucketStart(peak.top.bucket);
  const otherYear =
    start !== null && start.getUTCFullYear() !== new Date(now).getUTCFullYear();

  return (
    <Tile
      label={hourly ? "Busiest hour" : "Busiest day"}
      icon={FlameIcon}
      value={
        !peak || peak.ties > 1 || !start ? (
          <Nothing />
        ) : hourly ? (
          formatUtcHour(start)
        ) : (
          (otherYear ? peakDayWithYear : peakDay).format(start)
        )
      }
      footnote={
        !peak || !start
          ? "No clicks in this range"
          : peak.ties > 1
            ? `No clear peak: ${peak.ties} ${unit}s with ${pluralize(peak.top.clicks, "click")}`
            : `${(hourly ? peakHourDay : peakWeekday).format(start)}${hourly ? " UTC" : ""} · ${pluralize(peak.top.clicks, "click")}`
      }
    />
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
