import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { percentOf } from "@/lib/analytics";
import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import { formatCount } from "../format";

export type BarItem = {
  key: string;
  label: React.ReactNode;
  clicks: number;
  /** Unknown / other: shown last and muted. */
  muted?: boolean;
};

/**
 * A ranked list with a bar behind each row, sized against the top row: a bar chart that's also a
 * real list. Shows the first `limit` rows and folds the rest into "Show N more" below them.
 */
export function BarList({
  items,
  total,
  label,
  noun,
  limit = 8,
  className,
}: {
  items: BarItem[];
  /** All clicks in the range, for each row's share. */
  total: number;
  /** Accessible name of the list. */
  label: string;
  /** Plural noun for "Show 12 more countries". */
  noun: string;
  limit?: number;
  className?: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.clicks));
  const shown = items.slice(0, limit);
  const rest = items.slice(limit);

  const row = (item: BarItem) => (
    <li
      key={item.key}
      className="relative flex h-9 items-center gap-3 px-2.5 text-sm"
    >
      <span
        aria-hidden
        style={{ width: `${(item.clicks / max) * 100}%` }}
        className={cn(
          "absolute inset-y-0.5 left-0 rounded-md",
          item.muted
            ? "bg-muted dark:bg-muted/70"
            : "bg-chart-1/12 dark:bg-chart-1/14",
        )}
      />
      <span
        className={cn(
          "relative flex min-w-0 flex-1 items-center gap-2",
          item.muted && "text-muted-foreground",
        )}
      >
        {item.label}
      </span>
      <span className="relative font-medium tabular-nums">
        {formatCount(item.clicks)}
        <span className="sr-only">
          {" "}
          {item.clicks === 1 ? "click" : "clicks"},
        </span>
      </span>
      <span className="relative w-9 text-right text-xs text-muted-foreground tabular-nums">
        {percentOf(item.clicks, total)}%
      </span>
    </li>
  );

  return (
    <div className={className}>
      <ol aria-label={label} className="space-y-0.5">
        {shown.map(row)}
      </ol>
      {rest.length > 0 && (
        <Collapsible className="group/more flex flex-col">
          <CollapsibleContent>
            <ol
              start={limit + 1}
              aria-label={`${label}, continued`}
              className="mt-0.5 space-y-0.5"
            >
              {rest.map(row)}
            </ol>
          </CollapsibleContent>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-8 w-fit px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="group-data-[state=open]/more:hidden">
                Show {formatCount(rest.length)} more {noun}
              </span>
              <span className="hidden group-data-[state=open]/more:inline">
                Show fewer
              </span>
              <ChevronDownIcon
                aria-hidden
                className="size-3.5 transition-transform group-data-[state=open]/more:rotate-180"
              />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      )}
    </div>
  );
}
