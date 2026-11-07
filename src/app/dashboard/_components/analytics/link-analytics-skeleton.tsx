import { Skeleton } from "@/components/ui/skeleton";
import { ClicksOverTimeSkeleton } from "./clicks-over-time";
import { DevicesSkeleton } from "./devices";
import { analyticsStack, splitGrid } from "./link-analytics";
import { LocationsSkeleton } from "./locations";
import { RecentClicksSkeleton } from "./recent-clicks";
import { SourcesSkeleton } from "./sources";
import { SummaryCardsSkeleton } from "./summary-cards";
import { WeekHoursSkeleton } from "./week-hours";

/** A link's page while it loads: header, range toggle and every section, in their final sizes. */
export function LinkAnalyticsSkeleton({
  actions = true,
}: {
  /** The demo has no header actions. */
  actions?: boolean;
}) {
  return (
    <>
      <div aria-hidden>
        <Skeleton className="h-4 w-32" />
        <div className="mt-5 flex flex-col gap-5 sm:mt-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="mt-3 h-9 w-72 max-w-full sm:h-10" />
            <Skeleton className="mt-3 h-4 w-56 max-w-full" />
            <Skeleton className="mt-5 h-4 w-48" />
          </div>
          {actions && (
            <Skeleton className="h-10 w-full rounded-md sm:h-9 sm:w-64" />
          )}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full rounded-xl sm:w-72" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <div className={analyticsStack}>
        <SummaryCardsSkeleton />
        <ClicksOverTimeSkeleton />
        <LocationsSkeleton />
        <WeekHoursSkeleton />
        <div className={splitGrid}>
          <SourcesSkeleton />
          <DevicesSkeleton />
        </div>
        <RecentClicksSkeleton />
      </div>
      <p className="sr-only" role="status">
        Loading
      </p>
    </>
  );
}
