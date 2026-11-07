"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  RANGE_LABELS,
  bucketStart,
  peakOf,
  type AnalyticsRange,
  type Bucket,
  type ClicksPoint,
} from "@/lib/analytics";
import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { LOCALE, formatCount, pluralize } from "../format";
import { niceMax } from "../overview/clicks-chart-plot";

const chartConfig = {
  clicks: { label: "Clicks", color: "var(--chart-1)" },
} satisfies ChartConfig;

const utc = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...options });

const dayTick = utc({ month: "short", day: "numeric" });
const monthTick = utc({ month: "short", year: "numeric" });
const hourTick = utc({ hour: "numeric" });
const longDay = utc({
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});
const longHourDay = utc({ weekday: "short", month: "short", day: "numeric" });
const hourRange = utc({ hour: "numeric" });

/** "Thu, Nov 6, 2026" for a day; "Thu, Nov 6 · 2 – 3 PM" for an hour. */
export function describeBucket(key: string, bucket: Bucket) {
  const start = bucketStart(key);
  if (bucket === "day") return longDay.format(start);
  const end = new Date(start.getTime() + 3_600_000);
  return `${longHourDay.format(start)} · ${hourRange.formatRange(start, end)}`;
}

/** At most `max` evenly spread entries of `items`, always including the first and the last. */
function spread<T>(items: T[], max: number) {
  if (items.length <= max) return items;
  const step = (items.length - 1) / (max - 1);
  return Array.from(
    { length: max },
    (_, index) => items[Math.round(index * step)],
  );
}

/** Which buckets get an x-axis label, and how each label reads. */
function axisTicks(
  series: ClicksPoint[],
  bucket: Bucket,
  range: AnalyticsRange,
) {
  const keys = series.map((point) => point.bucket);
  if (bucket === "hour" && range === "24h") {
    return {
      ticks: spread(keys, 5),
      label: (key: string) => hourTick.format(bucketStart(key)),
    };
  }
  if (bucket === "hour") {
    // A week of hours: label midnights only.
    const midnights = keys.filter((key) => key.endsWith("T00"));
    return {
      ticks: spread(midnights.length >= 2 ? midnights : keys, 4),
      label: (key: string) => dayTick.format(bucketStart(key)),
    };
  }
  const long = keys.length > 400;
  return {
    ticks: spread(keys, 5),
    label: (key: string) =>
      (long ? monthTick : dayTick).format(bucketStart(key)),
  };
}

function EdgeTick({
  x,
  y,
  payload,
  first,
  last,
  label,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  first: string;
  last: string;
  label: (key: string) => string;
}) {
  if (!payload) return null;
  const anchor =
    payload.value === first
      ? "start"
      : payload.value === last
        ? "end"
        : "middle";
  return (
    <text
      x={x}
      y={y}
      dy={12}
      textAnchor={anchor}
      className="fill-muted-foreground text-[11px] tabular-nums"
    >
      {label(payload.value)}
    </text>
  );
}

export function ClicksOverTimePlot({
  series,
  bucket,
  range,
  createdBucket,
}: {
  series: ClicksPoint[];
  bucket: Bucket;
  range: AnalyticsRange;
  /** The bucket the link was created in, to mark it when it falls inside the window. */
  createdBucket: string | null;
}) {
  const id = useId();
  const peak = peakOf(series);
  const max = peak?.clicks ?? 0;
  const yMax = niceMax(max);
  const isEmpty = max === 0;
  const total = series.reduce((sum, point) => sum + point.clicks, 0);
  const first = series[0]?.bucket ?? "";
  const last = series.at(-1)?.bucket ?? "";
  const { ticks, label } = axisTicks(series, bucket, range);
  const unit = bucket === "hour" ? "hour" : "day";
  const period = RANGE_LABELS[range].long.toLowerCase();
  const showCreated =
    createdBucket !== null && createdBucket > first && createdBucket <= last;

  const summary = isEmpty
    ? `No clicks ${range === "all" ? "yet" : `in the ${period}`}.`
    : `${pluralize(total, "click")} ${range === "all" ? "in total" : `in the ${period}`}, peaking at ${pluralize(max, "click")} on ${describeBucket(peak!.bucket, bucket)} (UTC).`;

  return (
    <div className="relative">
      <div
        role="group"
        aria-label={`Clicks per ${unit} chart. Use the left and right arrow keys to read each ${unit}.`}
        aria-describedby={`${id}-summary`}
        // shadcn's container hides the SVG's outline; show the focus ring on the wrapper instead.
        className="relative rounded-md ring-offset-4 ring-offset-card has-[.recharts-surface:focus-visible]:ring-[3px] has-[.recharts-surface:focus-visible]:ring-ring/40"
      >
        <ChartContainer
          config={chartConfig}
          initialDimension={{ width: 960, height: 256 }}
          className="aspect-auto h-56 w-full sm:h-64 [&_.recharts-surface]:overflow-visible"
        >
          <AreaChart
            data={series}
            margin={{ top: 8, right: 2, bottom: 0, left: 2 }}
            accessibilityLayer
          >
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-clicks)"
                  stopOpacity={0.24}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-clicks)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis
              domain={[0, yMax]}
              ticks={[0, yMax / 2, yMax]}
              tickFormatter={(value: number) => formatCount(value)}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={isEmpty ? 0 : 36}
              hide={isEmpty}
            />
            <XAxis
              dataKey="bucket"
              ticks={ticks}
              tick={<EdgeTick first={first} last={last} label={label} />}
              tickLine={false}
              axisLine={false}
              interval={0}
              height={24}
            />
            {showCreated && (
              <ReferenceLine
                x={createdBucket}
                stroke="var(--muted-foreground)"
                strokeOpacity={0.5}
                strokeDasharray="3 3"
                label={{
                  value: "Created",
                  position: "insideTopLeft",
                  className: "fill-muted-foreground text-[11px]",
                  offset: 6,
                }}
              />
            )}
            {!isEmpty && (
              <ChartTooltip
                cursor={{ strokeOpacity: 0.6 }}
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(_, payload) => {
                      const key = (
                        payload?.[0]?.payload as ClicksPoint | undefined
                      )?.bucket;
                      return key ? describeBucket(key, bucket) : null;
                    }}
                    formatter={(value) => (
                      <span className="font-semibold text-foreground tabular-nums">
                        {pluralize(Number(value), "click")}
                      </span>
                    )}
                  />
                }
              />
            )}
            <Area
              dataKey="clicks"
              // Hours are spiky: straight segments don't invent curves between them.
              type={bucket === "hour" ? "linear" : "monotone"}
              stroke="var(--color-clicks)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeDasharray={isEmpty ? "4 4" : undefined}
              strokeOpacity={isEmpty ? 0.4 : 1}
              fill={isEmpty ? "transparent" : `url(#${id}-fill)`}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 3, className: "stroke-card" }}
            />
          </AreaChart>
        </ChartContainer>

        {isEmpty && (
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex items-center justify-center">
            <div className="rounded-xl bg-card px-4 py-2 text-center">
              <p className="text-sm font-medium">No clicks in this range</p>
              <p className="mt-0.5 max-w-64 text-xs text-pretty text-muted-foreground">
                Try a longer range, or share the link to get some.
              </p>
            </div>
          </div>
        )}
      </div>

      <p id={`${id}-summary`} className="sr-only">
        {summary}
      </p>
      {/* sr-only goes on a wrapper: a <caption> escapes the clip of an sr-only table in some browsers. */}
      {!isEmpty && (
        <div className="sr-only">
          <table>
            <caption>
              Clicks per {unit} (UTC), {period}
            </caption>
            <thead>
              <tr>
                <th scope="col">{bucket === "hour" ? "Hour" : "Date"}</th>
                <th scope="col">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {series.map((point) => (
                <tr key={point.bucket}>
                  <th scope="row">{describeBucket(point.bucket, bucket)}</th>
                  <td>{point.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
