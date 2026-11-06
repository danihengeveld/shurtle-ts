import { CreateLinkDeepLink } from "@/components/create/create-link-deep-link"
import { CreateLinkProvider } from "@/components/create/create-link-provider"
import { ClicksChartSkeleton } from "@/components/dashboard/clicks-chart"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { LinksSkeleton } from "@/components/dashboard/links/links-skeleton"
import { ClicksSection, LinksSection, StatsSection } from "@/components/dashboard/sections"
import { StatsCardsSkeleton } from "@/components/dashboard/stats-cards"
import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Create, share and track your short links.",
  robots: { index: false },
}

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
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
            <Suspense fallback={<StatsCardsSkeleton />}>
              <StatsSection />
            </Suspense>
            <Suspense fallback={<ClicksChartSkeleton />}>
              <ClicksSection />
            </Suspense>
          </div>
        </section>

        <section aria-labelledby="links-heading" className="mt-12 sm:mt-14">
          <Suspense fallback={<LinksSkeleton />}>
            <LinksSection searchParams={searchParams} />
          </Suspense>
        </section>
      </div>
    </CreateLinkProvider>
  )
}
