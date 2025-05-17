import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ShurtlesSection } from "@/components/dashboard/shurtles-section";
import { ShurtlesSectionSkeleton } from "@/components/dashboard/shurtles-section-skeleton";
import { Stats } from "@/components/dashboard/stats";
import { StatsSkeleton } from "@/components/dashboard/stats-skeleton";
import { Suspense } from "react";

export const experimental_ppr = true

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; perPage?: string }>
}) {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <DashboardHeader />
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>
      <Suspense fallback={<ShurtlesSectionSkeleton />}>
        <ShurtlesSection searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
