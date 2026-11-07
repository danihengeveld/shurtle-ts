"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ANALYTICS_RANGES,
  RANGE_LABELS,
  analyticsHref,
  type AnalyticsRange,
} from "@/lib/analytics";
import { cn } from "cn";
import { usePathname } from "next/navigation";
import { useOptimistic } from "react";
import { useAnalyticsNavigation } from "./analytics-provider";

/**
 * 24h / 7d / 30d / 90d / All. The range lives in the URL (`?range=`), so it survives a reload and
 * can be shared; picking one moves straight to it while the numbers load. Back to the first page
 * of recent clicks, which belong to the range.
 */
export function RangeToggle({
  range,
  className,
}: {
  range: AnalyticsRange;
  className?: string;
}) {
  const pathname = usePathname();
  const { navigate } = useAnalyticsNavigation();
  const [shown, setShown] = useOptimistic(range);

  return (
    <ToggleGroup
      type="single"
      value={shown}
      onValueChange={(value) => {
        // Radix sends "" when the pressed item is pressed again: a range is always selected.
        if (!value || value === shown) return;
        const next = value as AnalyticsRange;
        navigate(analyticsHref(pathname, { range: next }), () =>
          setShown(next),
        );
      }}
      aria-label="Time range"
      className={cn(
        "h-10 w-full rounded-xl bg-muted p-1 sm:w-fit dark:bg-input/40",
        className,
      )}
    >
      {ANALYTICS_RANGES.map((value) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={RANGE_LABELS[value].long}
          // Matches the dashboard's Active / Expired tabs. text-muted-foreground: shadcn's default
          // inactive colour misses AA contrast on paper.
          className="h-8 flex-1 rounded-lg! border border-transparent px-3 text-[13px] text-muted-foreground tabular-nums hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-[0_1px_2px_oklch(0_0_0/0.08),0_0_0_1px_var(--border)] sm:flex-none dark:data-[state=on]:border-input dark:data-[state=on]:bg-input/30"
        >
          {RANGE_LABELS[value].short}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
