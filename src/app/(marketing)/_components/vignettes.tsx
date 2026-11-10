import { LogoMark } from "@/components/logo";
import { siteInfo } from "@/lib/site";
import { cn } from "cn";
import {
  Archive,
  ArrowUpRight,
  CalendarClock,
  Flame,
  Moon,
  RotateCcw,
  Shuffle,
  Sun,
} from "lucide-react";
import { SHADE_BACKGROUNDS } from "../../dashboard/_components/analytics/shade-legend";

/*
 * Miniature, static UI scenes for the feature bento. All decorative: each card's heading and copy
 * carry the meaning, so every vignette is aria-hidden by its container.
 */

const field =
  "flex h-10 min-w-0 flex-1 items-center rounded-lg border bg-card px-3 font-mono text-[0.8125rem] shadow-xs";
const miniLabel =
  "w-[4.75rem] shrink-0 text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase";

export function SlugVignette() {
  const host = siteInfo.baseUrl.host;
  return (
    <div className="w-full max-w-md space-y-3">
      <div className="flex items-center gap-3">
        <span className={cn(miniLabel, "max-sm:hidden")}>Custom</span>
        <div
          className={cn(
            field,
            "border-foreground/25 ring-4 ring-brand/35 dark:border-brand/60 dark:ring-brand/15",
          )}
        >
          <span className="truncate">
            <span className="text-muted-foreground">{host}/</span>
            <span className="font-semibold">launch-party</span>
          </span>
          <span className="ml-px h-4 w-0.5 shrink-0 animate-blink rounded-full bg-brand-ink" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn(miniLabel, "max-sm:hidden")}>Generated</span>
        <div className={field}>
          <span className="truncate">
            <span className="text-muted-foreground">{host}/</span>
            <span className="font-semibold">x7Kp2qR</span>
          </span>
        </div>
        <span className="flex h-7 shrink-0 items-center gap-1 rounded-full border bg-card px-2.5 text-xs font-medium text-muted-foreground shadow-xs">
          <Shuffle className="size-3.5" />
          <span className="max-[25rem]:hidden">Random</span>
        </span>
      </div>
    </div>
  );
}

export function ExpiryVignette() {
  return (
    <div className="w-full max-w-xs space-y-2.5">
      <div className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-3 shadow-xs">
        <span className="size-2 shrink-0 rounded-full bg-success" />
        <span className="min-w-0 flex-1 truncate font-mono text-[0.8125rem] font-medium">
          spring-sale
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-warning/18 px-2 py-1 text-xs font-medium">
          <CalendarClock className="size-3.5" />
          Mar 31
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-dashed bg-card/50 px-3.5 py-3">
        <span className="size-2 shrink-0 rounded-full bg-muted-foreground/40" />
        <span className="min-w-0 flex-1 truncate font-mono text-[0.8125rem] text-muted-foreground line-through decoration-muted-foreground/60">
          beta-invite
        </span>
        <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-brand-soft px-2 py-1 text-xs font-medium dark:bg-brand-soft/50">
          <RotateCcw className="size-3.5 text-brand-ink" />
          Renew · 17h
        </span>
      </div>
      <p className="flex items-center gap-1.5 pl-1 text-xs text-muted-foreground">
        <Archive className="size-3" />
        Kept in your dashboard, clicks and all
      </p>
    </div>
  );
}

export function ProxyVignette() {
  return (
    <div className="w-full max-w-xs rounded-xl bg-primary p-4 font-mono text-[0.75rem]/[1.9] text-primary-foreground shadow-lift dark:bg-black/45 dark:text-foreground dark:ring-1 dark:ring-white/10">
      <div>
        <span className="text-brand">GET</span> /x7Kp2qR
      </div>
      <div className="text-primary-foreground/65 dark:text-foreground/60">
        <span aria-hidden="true">├─</span> proxy resolves slug
      </div>
      <div className="text-primary-foreground/65 dark:text-foreground/60">
        <span aria-hidden="true">├─</span> visit logged after
      </div>
      <div>
        <span className="text-primary-foreground/65 dark:text-foreground/60">
          └─
        </span>{" "}
        <span className="rounded bg-brand px-1 py-px font-semibold text-brand-foreground">
          307
        </span>{" "}
        example.com/…
      </div>
    </div>
  );
}

/** Illustrative clicks per day for the chart; not real data. */
const DAILY = [
  18, 22, 19, 27, 31, 24, 20, 26, 34, 41, 38, 45, 52, 47, 39, 44, 58, 63, 55,
  49, 61, 72, 68, 59, 66, 81, 77, 70, 85, 92,
] as const;

const CHART_WIDTH = 600;
const CHART_HEIGHT = 160;

/** The clicks chart's line and the area under it, scaled into the viewBox. */
function chartPaths() {
  const max = Math.max(...DAILY);
  const step = CHART_WIDTH / (DAILY.length - 1);
  const points = DAILY.map(
    (clicks, day) =>
      `${Math.round(day * step)} ${Math.round(CHART_HEIGHT - (clicks / max) * (CHART_HEIGHT - 12))}`,
  );
  const line = `M${points.join("L")}`;
  return {
    line,
    area: `${line}L${CHART_WIDTH} ${CHART_HEIGHT}L0 ${CHART_HEIGHT}Z`,
  };
}

const miniCard =
  "min-w-0 rounded-xl border bg-card/95 p-3 shadow-lift backdrop-blur-sm";

/** Illustrative hour-of-day pattern for the busiest-time strip; not real data. */
const HOURS = [1, 1, 0, 0, 1, 2, 3, 4, 3, 3, 4, 5, 4, 3] as const;

/**
 * A link's page in miniature: the clicks chart, with the numbers, the busiest time and the top
 * sources in a row of cards tucked under it.
 */
export function AnalyticsVignette() {
  const { line, area } = chartPaths();
  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-xl border bg-card/80 px-4 pt-3 pb-8 shadow-soft sm:pb-12">
        <p className="text-[0.6875rem] font-medium text-muted-foreground">
          Clicks over time
        </p>
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="mt-3 block h-28 w-full sm:h-36"
        >
          <path d={area} className="fill-chart-1/12" />
          <path
            d={line}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="stroke-chart-1"
          />
        </svg>
      </div>

      <div className="relative -mt-6 grid grid-cols-2 gap-3 sm:-mt-10 sm:grid-cols-3">
        <div className={miniCard}>
          <p className="text-[0.6875rem] font-medium text-muted-foreground">
            Clicks · 30 days
          </p>
          <p className="mt-1 font-display text-2xl leading-none font-semibold tracking-tight tabular-nums">
            1,284
          </p>
          <p className="mt-2 flex items-center gap-1 text-[0.6875rem] text-muted-foreground">
            <span className="inline-flex items-center gap-0.5 rounded-md bg-success/15 px-1 font-medium text-foreground tabular-nums">
              <ArrowUpRight className="size-3 text-success" />
              18%
            </span>
            vs. the 30 days before
          </p>
        </div>

        <div className={miniCard}>
          <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-muted-foreground">
            <Flame className="size-3" />
            Busiest
          </p>
          <p className="mt-1 text-sm font-semibold">Thursdays, 4 PM</p>
          <div className="mt-2 flex gap-0.5">
            {HOURS.map((shade, index) => (
              <span
                key={index}
                className={cn(
                  "h-3 flex-1 rounded-[2px]",
                  SHADE_BACKGROUNDS[shade],
                )}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[0.625rem] text-muted-foreground">
            <span>9a</span>
            <span>4p</span>
            <span>10p</span>
          </div>
        </div>

        {/* Two cards fit a phone; the sources join them from sm. */}
        <div className={cn(miniCard, "max-sm:hidden")}>
          <p className="text-[0.6875rem] font-medium text-muted-foreground">
            Top sources
          </p>
          <ul className="mt-2 space-y-1">
            {[
              ["x.com", 31],
              ["Direct", 24],
              ["linkedin.com", 15],
            ].map(([name, share]) => (
              <li
                key={name}
                className="relative flex h-6 items-center justify-between px-1.5 text-[0.75rem]"
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-md bg-chart-1/14"
                  style={{ width: `${(Number(share) / 31) * 100}%` }}
                />
                <span className="relative">{name}</span>
                <span className="relative text-muted-foreground tabular-nums">
                  {share}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function RateLimitVignette() {
  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center justify-between text-[0.6875rem] font-medium tracking-[0.06em] text-muted-foreground uppercase">
        <span>Opens this minute</span>
        <span className="font-mono tracking-normal">60 per IP</span>
      </div>
      <div className="mt-2.5 flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="h-8 flex-1 rounded-md bg-chart-1/80" />
        ))}
        <span className="h-8 flex-1 rounded-md border-2 border-dashed border-destructive/70 bg-destructive/10" />
      </div>
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border bg-card p-3 shadow-soft">
        <span className="mt-0.5 rounded bg-destructive px-1.5 py-px font-mono text-[0.6875rem] font-semibold text-white dark:bg-destructive/15 dark:text-destructive">
          429
        </span>
        <span className="text-[0.8125rem]/snug">
          <span className="font-medium">Even turtles need a breather.</span>{" "}
          <span className="text-muted-foreground">Try again in a minute.</span>
        </span>
      </div>
    </div>
  );
}

const LIGHT = {
  bg: "oklch(0.986 0.005 106)",
  fg: "oklch(0.205 0.022 162)",
  line: "oklch(0.905 0.01 110)",
};
const DARK = {
  bg: "oklch(0.158 0.013 162)",
  fg: "oklch(0.955 0.012 110)",
  line: "oklch(1 0 0 / 0.12)",
};

function MiniScreen({
  scheme,
  className,
}: {
  scheme: typeof LIGHT;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-36 rounded-xl p-3 shadow-lift ring-1 ring-black/5 sm:w-40",
        className,
      )}
      style={{ backgroundColor: scheme.bg, color: scheme.fg }}
    >
      <div className="flex items-center gap-1.5">
        <LogoMark className="h-3.5" />
        <span
          className="h-1.5 w-8 rounded-full"
          style={{ backgroundColor: scheme.fg, opacity: 0.85 }}
        />
      </div>
      <div className="mt-3 space-y-1.5">
        <span
          className="block h-1.5 w-full rounded-full"
          style={{ backgroundColor: scheme.line }}
        />
        <span
          className="block h-1.5 w-4/5 rounded-full"
          style={{ backgroundColor: scheme.line }}
        />
      </div>
      <span className="mt-3 block h-5 w-16 rounded-md bg-brand" />
    </div>
  );
}

export function ThemeVignette() {
  return (
    <div className="relative flex h-full items-center justify-center py-2">
      <div className="relative">
        <MiniScreen scheme={LIGHT} className="-rotate-6" />
        <MiniScreen
          scheme={DARK}
          className="absolute top-5 left-16 rotate-3 sm:left-20"
        />
        <span className="absolute -top-3 -left-3 grid size-8 place-items-center rounded-full border bg-card shadow-soft">
          <Sun className="size-4" />
        </span>
        <span className="absolute -right-24 -bottom-7 grid size-8 place-items-center rounded-full border bg-card shadow-soft sm:-right-28">
          <Moon className="size-4" />
        </span>
      </div>
    </div>
  );
}
