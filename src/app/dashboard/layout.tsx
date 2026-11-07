import type { Metadata } from "next";
import { Suspense } from "react";
import { CreateLinkDeepLink } from "./_components/create/create-link-deep-link";
import { CreateLinkProvider } from "./_components/create/create-link-provider";
import { DashboardHeader } from "./_components/dashboard-header";
import { LinksToolbarSkeleton } from "./_components/links/links-skeleton";
import { LinksToolbar } from "./_components/links/links-toolbar";
import {
  LinksBusyRegion,
  LinksProvider,
} from "./_components/links/links-provider";
import { ClicksChartSkeleton } from "./_components/overview/clicks-chart";
import { ClicksSection, StatsSection } from "./_components/overview/sections";
import { StatsCardsSkeleton } from "./_components/overview/stats-cards";
import {
  LinksToolbarErrorBoundary,
  SectionErrorBoundary,
} from "./_components/section-error";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Create, share and track your short links.",
  robots: { index: false },
};

/**
 * Everything that stays put while the list changes: header, overview and the links toolbar. The
 * list itself is `children`: `(active)/page.tsx` at /dashboard and `expired/page.tsx` at
 * /dashboard/expired, each with its own `loading.tsx`. Every data read below is in a Suspense
 * boundary, so the shell prerenders and each part streams in on its own.
 *
 * Errors: `error.tsx` here only wraps `children` (the list); the overview sections and the toolbar
 * each have their own boundary, so one failing query doesn't take down the rest of the dashboard.
 */
export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <CreateLinkProvider>
      <Suspense fallback={null}>
        <CreateLinkDeepLink />
      </Suspense>

      <div className="container-page py-8 sm:py-10 lg:py-12">
        <DashboardHeader />

        <section aria-labelledby="overview-heading" className="mt-8 sm:mt-10">
          <h2 id="overview-heading" className="sr-only">
            Overview
          </h2>
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <SectionErrorBoundary what="your stats" className="min-h-48">
              <Suspense fallback={<StatsCardsSkeleton />}>
                <StatsSection />
              </Suspense>
            </SectionErrorBoundary>
            <SectionErrorBoundary what="the clicks chart" className="min-h-48">
              <Suspense fallback={<ClicksChartSkeleton />}>
                <ClicksSection />
              </Suspense>
            </SectionErrorBoundary>
          </div>
        </section>

        <section aria-labelledby="links-heading" className="mt-12 sm:mt-14">
          <LinksProvider>
            <div id="links" className="scroll-mt-24">
              <LinksToolbarErrorBoundary>
                <Suspense fallback={<LinksToolbarSkeleton />}>
                  <LinksToolbar />
                </Suspense>
              </LinksToolbarErrorBoundary>
              <LinksBusyRegion className="mt-4">{children}</LinksBusyRegion>
            </div>
          </LinksProvider>
        </section>
      </div>
    </CreateLinkProvider>
  );
}
