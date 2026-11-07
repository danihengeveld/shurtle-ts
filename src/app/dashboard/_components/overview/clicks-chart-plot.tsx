"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatCount, formatUtcDay, pluralize } from "../format";

type Point = { date: string; clicks: number };

/**
 * Round up to a "nice" axis maximum (1, 2, 2.5, 4, 5, 6, 8 × 10ⁿ), with a little headroom. The axis
 * has a midpoint tick, so the result always halves to a whole number of clicks (never "2.5").
 */
export function niceMax(max: number) {
  if (max <= 0) return 4;
  const target = max * 1.1;
  const magnitude = 10 ** Math.floor(Math.log10(target));
  for (const step of [1, 2, 2.5, 4, 5, 6, 8, 10]) {
    const value = Math.max(step * magnitude, 4);
    if (value >= target && Number.isInteger(value / 2)) return value;
  }
  return 10 * magnitude;
}

const chartConfig = {
  clicks: { label: "Clicks", color: "var(--chart-1)" },
} satisfies ChartConfig;

const longDay = { weekday: "short", month: "short", day: "numeric" } as const;

/** X-axis label anchored to the edge for the first/last tick, so "Oct 8" and "Today" aren't clipped. */
function EdgeTick({
  x,
  y,
  payload,
  first,
  last,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  first: string;
  last: string;
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
      {payload.value === last ? "Today" : formatUtcDay(payload.value)}
    </text>
  );
}

export function ClicksChartPlot({ data }: { data: Point[] }) {
  const id = useId();
  const max = Math.max(0, ...data.map((point) => point.clicks));
  const yMax = niceMax(max);
  const isEmpty = max === 0;
  const lastIndex = data.length - 1;
  const first = data[0]?.date ?? "";
  const last = data[lastIndex]?.date ?? "";
  const middle = data[Math.floor(lastIndex / 2)]?.date;

  const summary = isEmpty
    ? "No clicks in the last 30 days."
    : `${pluralize(
        data.reduce((sum, point) => sum + point.clicks, 0),
        "click",
      )} in the last 30 days, peaking at ${pluralize(max, "click")} on ${formatUtcDay(data[data.findIndex((point) => point.clicks === max)].date, longDay)}.`;

  return (
    <div className="relative">
      {/* Recharts' accessibility layer makes the chart focusable; arrow keys move the tooltip by day. */}
      <div
        role="group"
        aria-label="Daily clicks chart. Use the left and right arrow keys to read each day."
        aria-describedby={`${id}-summary`}
        // shadcn's container hides the SVG's outline; show the focus ring on the wrapper instead.
        className="relative rounded-md ring-offset-4 ring-offset-card has-[.recharts-surface:focus-visible]:ring-[3px] has-[.recharts-surface:focus-visible]:ring-ring/40"
      >
        <ChartContainer
          config={chartConfig}
          initialDimension={{ width: 560, height: 208 }}
          className="aspect-auto h-[11.5rem] w-full sm:h-52 [&_.recharts-surface]:overflow-visible"
        >
          <AreaChart
            data={data}
            margin={{ top: 8, right: 2, bottom: 0, left: 2 }}
            accessibilityLayer
          >
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-clicks)"
                  stopOpacity={0.22}
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
              width={isEmpty ? 0 : 32}
              hide={isEmpty}
            />
            <XAxis
              dataKey="date"
              ticks={[first, middle, last].filter(Boolean) as string[]}
              tick={<EdgeTick first={first} last={last} />}
              tickLine={false}
              axisLine={false}
              interval={0}
              height={24}
            />
            {!isEmpty && (
              <ChartTooltip
                cursor={{ strokeOpacity: 0.6 }}
                content={
                  <ChartTooltipContent
                    hideIndicator
                    labelFormatter={(_, payload) => {
                      const date = (payload?.[0]?.payload as Point | undefined)
                        ?.date;
                      return date ? formatUtcDay(date, longDay) : null;
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
              type="monotone"
              stroke="var(--color-clicks)"
              strokeWidth={2}
              strokeDasharray={isEmpty ? "4 4" : undefined}
              strokeOpacity={isEmpty ? 0.4 : 1}
              fill={isEmpty ? "transparent" : `url(#${id}-fill)`}
              isAnimationActive={false}
              // "Today" marker on the last point; hovering shows the active dot instead.
              dot={({ index, cx, cy }) =>
                index === lastIndex && !isEmpty ? (
                  <circle
                    key="today"
                    cx={cx}
                    cy={cy}
                    r={5}
                    className="fill-chart-1 stroke-card"
                    strokeWidth={3}
                  />
                ) : (
                  <g key={index} />
                )
              }
              activeDot={{ r: 5, strokeWidth: 3, className: "stroke-card" }}
            />
          </AreaChart>
        </ChartContainer>

        {isEmpty && (
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex items-center justify-center">
            <div className="rounded-xl bg-card px-4 py-2 text-center">
              <p className="text-sm font-medium">No clicks yet</p>
              <p className="mt-0.5 max-w-60 text-xs text-pretty text-muted-foreground">
                Share one of your links. Every click will show up here.
              </p>
            </div>
          </div>
        )}
      </div>

      <p id={`${id}-summary`} className="sr-only">
        {summary}
      </p>
      {/* sr-only goes on a wrapper: a <caption> escapes the clip of an sr-only table in some browsers. */}
      <div className="sr-only">
        <table>
          <caption>Clicks per day (UTC), last 30 days</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.date}>
                <th scope="row">
                  {formatUtcDay(point.date, { ...longDay, year: "numeric" })}
                </th>
                <td>{point.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
