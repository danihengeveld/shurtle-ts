import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "cn";
import { LinksHeading } from "./links-panel";

const ROWS = 6;
const widths = ["w-24", "w-32", "w-20", "w-28", "w-24", "w-36"];
const destinationWidths = ["w-56", "w-40", "w-64", "w-48", "w-52", "w-44"];

/** Mirrors <LinksPanel> (heading, search, table / list, footer) so nothing shifts when it loads. */
export function LinksSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading links">
      <LinksHeading>
        <Skeleton className="h-10 w-full rounded-xl sm:w-80" />
      </LinksHeading>

      <div className="mt-4">
        <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-soft md:block">
          <div className="flex h-10 items-center gap-6 border-b bg-muted/45 px-5 dark:bg-muted/30">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          {Array.from({ length: ROWS }, (_, index) => (
            <div
              key={index}
              className="flex h-[3.75rem] items-center gap-6 border-b px-5 last:border-0"
            >
              <Skeleton className={cn("h-4", widths[index])} />
              <Skeleton
                className={cn("ml-[8%] h-4", destinationWidths[index])}
              />
              <Skeleton className="ml-auto h-4 w-8" />
              <Skeleton className="hidden h-4 w-16 lg:block" />
              <Skeleton className="hidden h-4 w-16 lg:block" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="size-6 rounded-md" />
            </div>
          ))}
        </div>

        <div className="divide-y overflow-hidden rounded-2xl border bg-card shadow-soft md:hidden">
          {Array.from({ length: ROWS }, (_, index) => (
            <div key={index} className="py-3 pr-2 pl-4">
              <div className="flex h-10 items-center justify-between gap-2">
                <Skeleton className={cn("h-4", widths[index])} />
                <Skeleton className="mr-2 size-6 rounded-md" />
              </div>
              <Skeleton
                className={cn(
                  "mt-0.5 h-4 max-w-[80%]",
                  destinationWidths[index],
                )}
              />
              <Skeleton className="mt-3.5 mb-0.5 h-3.5 w-44" />
            </div>
          ))}
        </div>

        <div className="mt-4 flex h-9 items-center">
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </div>
  );
}
