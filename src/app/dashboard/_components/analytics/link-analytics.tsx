import {
  analyticsWindow,
  type AnalyticsLink,
  type AnalyticsRange,
  type AnalyticsSource,
} from "@/lib/analytics";
import { Suspense } from "react";
import { ExpiryEditorProvider } from "../links/expiry-editor";
import { SectionErrorBoundary } from "../section-error";
import { ServerNowProvider } from "../time";
import { AnalyticsBusyRegion, AnalyticsProvider } from "./analytics-provider";
import { ClicksOverTime, ClicksOverTimeSkeleton } from "./clicks-over-time";
import { LinkHeader } from "./link-header";
import { Locations, LocationsSkeleton } from "./locations";
import { NoClicksYet } from "./no-clicks-yet";
import { RangeToggle } from "./range-toggle";
import { RecentClicks, RecentClicksSkeleton } from "./recent-clicks";
import { SummaryCards, SummaryCardsSkeleton } from "./summary-cards";

/** Everything below the header, shared by the page and its loading state. */
export const analyticsStack = "mt-4 flex flex-col gap-3 sm:gap-4";

/**
 * A link's page: its header, then how it's used in the chosen range. Each section loads in its own
 * Suspense boundary, behind its own error boundary, so a slow or failing query only affects its
 * own card. The data comes from `source`: the database for the owner's links, or sample data for
 * the demo.
 */
export function LinkAnalytics({
  link,
  source,
  range,
  page,
  now,
  basePath,
  demo = false,
}: {
  link: AnalyticsLink;
  source: AnalyticsSource;
  range: AnalyticsRange;
  /** Page of recent clicks. */
  page: number;
  /** Request time (ms): the window's end, and the clock relative times render with on the server. */
  now: number;
  /** The page's path, for links that change the range or page. */
  basePath: string;
  demo?: boolean;
}) {
  const window = analyticsWindow(range, now, link.createdAt);
  // Started here, once: the number cards and the chart both read the clicks over time.
  const clicks = source.clicksOverTime(window);

  return (
    <ServerNowProvider now={now}>
      <ExpiryEditorProvider>
        <AnalyticsProvider>
          <LinkHeader link={link} demo={demo} />

          {link.hits === 0 ? (
            <NoClicksYet link={link} now={now} />
          ) : (
            <>
              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
                <RangeToggle range={range} />
                <p className="text-xs text-muted-foreground">
                  Updated every minute · times in UTC
                </p>
              </div>

              <AnalyticsBusyRegion className={analyticsStack}>
                <SectionErrorBoundary what="the numbers" className="min-h-36">
                  <Suspense fallback={<SummaryCardsSkeleton />}>
                    <SummaryCards
                      clicks={clicks}
                      lastClick={source.lastClick()}
                      allTimeClicks={link.hits}
                      createdAt={link.createdAt}
                      window={window}
                      now={now}
                    />
                  </Suspense>
                </SectionErrorBoundary>

                <SectionErrorBoundary
                  what="the clicks chart"
                  className="min-h-80"
                >
                  <Suspense
                    fallback={<ClicksOverTimeSkeleton bucket={window.bucket} />}
                  >
                    <ClicksOverTime
                      data={clicks}
                      window={window}
                      createdAt={link.createdAt}
                    />
                  </Suspense>
                </SectionErrorBoundary>

                <SectionErrorBoundary what="locations" className="min-h-96">
                  <Suspense fallback={<LocationsSkeleton />}>
                    <Locations data={source.locations(window)} />
                  </Suspense>
                </SectionErrorBoundary>

                <SectionErrorBoundary what="recent clicks" className="min-h-96">
                  <Suspense fallback={<RecentClicksSkeleton />}>
                    <RecentClicks
                      data={source.recentClicks(window, page)}
                      range={range}
                      basePath={basePath}
                    />
                  </Suspense>
                </SectionErrorBoundary>
              </AnalyticsBusyRegion>
            </>
          )}
        </AnalyticsProvider>
      </ExpiryEditorProvider>
    </ServerNowProvider>
  );
}
