"use client";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { formatCount } from "../format";

export type DonutSlice = { key: string; clicks: number; color: string };

/**
 * The device split as a donut with the total in the middle. Decorative for assistive tech: the
 * list next to it has every number, with names and icons rather than colours.
 */
export function DevicesDonut({
  slices,
  total,
}: {
  slices: DonutSlice[];
  total: number;
}) {
  const config = Object.fromEntries(
    slices.map((slice) => [
      slice.key,
      { label: slice.key, color: slice.color },
    ]),
  ) satisfies ChartConfig;

  return (
    <div aria-hidden className="relative mx-auto size-36 shrink-0 sm:size-40">
      <ChartContainer
        config={config}
        initialDimension={{ width: 160, height: 160 }}
        className="aspect-square size-full"
      >
        <PieChart>
          <Pie
            data={slices.map((slice) => ({
              ...slice,
              fill: `var(--color-${slice.key})`,
            }))}
            dataKey="clicks"
            nameKey="key"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={slices.length > 1 ? 2 : 0}
            cornerRadius={4}
            stroke="var(--card)"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
          />
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl leading-none font-semibold tracking-tight tabular-nums">
          {formatCount(total)}
        </span>
        <span className="mt-1 text-[11px] text-muted-foreground">
          {total === 1 ? "click" : "clicks"}
        </span>
      </div>
    </div>
  );
}
