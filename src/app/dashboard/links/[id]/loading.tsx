import { Skeleton } from "@/components/ui/skeleton";
import { ClicksOverTimeSkeleton } from "../../_components/analytics/clicks-over-time";
import { DevicesSkeleton } from "../../_components/analytics/devices";
import {
  analyticsStack,
  splitGrid,
} from "../../_components/analytics/link-analytics";
import { LocationsSkeleton } from "../../_components/analytics/locations";
import { RecentClicksSkeleton } from "../../_components/analytics/recent-clicks";
import { SourcesSkeleton } from "../../_components/analytics/sources";
import { SummaryCardsSkeleton } from "../../_components/analytics/summary-cards";
import { WeekHoursSkeleton } from "../../_components/analytics/week-hours";

/** The page's shape while the link loads: header, range toggle and every section. */
export default function Loading() {
  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <div aria-hidden>
        <Skeleton className="h-4 w-32" />
        <div className="mt-5 flex flex-col gap-5 sm:mt-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="mt-3 h-9 w-72 max-w-full sm:h-10" />
            <Skeleton className="mt-3 h-4 w-56 max-w-full" />
            <Skeleton className="mt-5 h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-full rounded-md sm:h-9 sm:w-64" />
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full rounded-xl sm:w-72" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <div className={analyticsStack}>
        <SummaryCardsSkeleton />
        <ClicksOverTimeSkeleton bucket="day" />
        <LocationsSkeleton />
        <WeekHoursSkeleton />
        <div className={splitGrid}>
          <SourcesSkeleton />
          <DevicesSkeleton />
        </div>
        <RecentClicksSkeleton />
      </div>
      <p className="sr-only" role="status">
        Loading link
      </p>
    </div>
  );
}
