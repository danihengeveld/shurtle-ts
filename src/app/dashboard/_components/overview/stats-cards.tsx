import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  CircleCheckIcon,
  Link2Icon,
  MinusIcon,
  MousePointerClickIcon,
  TrendingUpIcon,
  type LucideIcon,
} from "lucide-react";
import { formatCount, getTrend, pluralize, type Trend } from "../format";

export type StatsData = {
  totalShurtles: number;
  activeShurtles: number;
  expiredShurtles: number;
  totalHits: number;
};

export const tile =
  "flex min-w-0 flex-col rounded-2xl border bg-card p-4 shadow-soft sm:p-5";
const grid =
  "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:auto-rows-fr lg:grid-cols-2";

export const accentTile =
  "relative isolate overflow-hidden border-brand/45 bg-brand-soft/70 dark:border-brand/20 dark:bg-brand-soft/45";

/** Faint hex "shell" lattice fading in from the corner of the accent tile. */
function ShellCorner() {
  return (
    <div
      aria-hidden
      className="absolute inset-y-0 right-0 -z-10 w-3/4 [mask-image:radial-gradient(90%_90%_at_100%_100%,black,transparent_75%)]"
    >
      <div className="size-full shell-pattern bg-brand-ink/25! dark:bg-brand/20!" />
    </div>
  );
}

export function Tile({
  label,
  value,
  footnote,
  icon: Icon,
  accent = false,
  className,
}: {
  label: string;
  value: React.ReactNode;
  footnote: React.ReactNode;
  icon: LucideIcon;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(tile, accent && accentTile, className)}>
      {accent && <ShellCorner />}
      <dl className="flex flex-1 flex-col">
        <dt className="flex items-start justify-between gap-2 pt-0.5 text-[13px] leading-5 font-medium text-muted-foreground">
          {label}
          <Icon
            aria-hidden
            className={cn(
              "mt-0.5 size-4 shrink-0 text-muted-foreground/70 max-sm:hidden",
              accent && "text-brand-ink",
            )}
          />
        </dt>
        <dd className="mt-auto pt-4 font-display text-[2rem] leading-none font-semibold tracking-tight tabular-nums sm:text-[2.25rem]">
          {value}
        </dd>
        <dd className="mt-2 min-h-10 text-xs leading-5 text-muted-foreground lg:min-h-5">
          {footnote}
        </dd>
      </dl>
    </div>
  );
}

const WEEK_TREND = {
  none: "No clicks in the last 14 days",
  previous: "the week before",
};

/** The change from a previous period, e.g. "↑ 12% vs. the week before". */
export function TrendNote({
  trend,
  text = WEEK_TREND,
}: {
  trend: Trend;
  /** `previous` names the period compared with; `none` is shown when neither had clicks. */
  text?: { none: string; previous: string };
}) {
  switch (trend.kind) {
    case "none":
      return <span>{text.none}</span>;
    case "new":
      return <span>Up from none {text.previous}</span>;
    case "flat":
      return (
        <span className="inline-flex items-center gap-1">
          <MinusIcon aria-hidden className="size-3.5" />
          Same as {text.previous}
        </span>
      );
    default: {
      const up = trend.kind === "up";
      const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;
      return (
        <span className="inline-flex flex-wrap items-center gap-x-1">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1 font-medium text-foreground tabular-nums",
              up ? "bg-success/15" : "bg-destructive/10",
            )}
          >
            <Icon
              aria-hidden
              className={cn(
                "size-3.5",
                up ? "text-success" : "text-destructive",
              )}
            />
            <span className="sr-only">{up ? "Up" : "Down"} </span>
            {trend.percent > 999 ? ">999" : trend.percent}%
          </span>
          <span>vs. {text.previous}</span>
        </span>
      );
    }
  }
}

/** Sum of the last 7 days vs. the 7 days before, from a 30-day daily series (oldest first). */
export function weekOverWeek(daily: { clicks: number }[]) {
  const sum = (items: { clicks: number }[]) =>
    items.reduce((total, item) => total + item.clicks, 0);
  const current = sum(daily.slice(-7));
  const previous = sum(daily.slice(-14, -7));
  return { current, previous, trend: getTrend(current, previous) };
}

export function StatsCards({
  stats,
  daily,
}: {
  stats: StatsData;
  daily: { clicks: number }[];
}) {
  const expired = stats.expiredShurtles;
  const week = weekOverWeek(daily);

  return (
    <div className={grid}>
      <Tile
        label="Total links"
        icon={Link2Icon}
        value={formatCount(stats.totalShurtles)}
        footnote={
          stats.totalShurtles === 0 ? "Create one to get started" : "All time"
        }
      />
      <Tile
        label="Active links"
        icon={CircleCheckIcon}
        value={formatCount(stats.activeShurtles)}
        footnote={
          stats.totalShurtles === 0
            ? "Links that still redirect"
            : expired === 0
              ? "None expired"
              : `${pluralize(expired, "expired link")}`
        }
      />
      <Tile
        label="Total clicks"
        icon={MousePointerClickIcon}
        value={formatCount(stats.totalHits)}
        footnote={
          stats.totalHits === 0 ? "Share a link to get clicks" : "All time"
        }
      />
      <Tile
        label="Last 7 days"
        icon={TrendingUpIcon}
        value={formatCount(week.current)}
        footnote={<TrendNote trend={week.trend} />}
        accent
      />
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className={grid} aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className={cn(tile, index === 3 && accentTile)}>
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
