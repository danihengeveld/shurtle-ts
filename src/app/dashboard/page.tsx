import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ShurtlesSection } from "@/components/dashboard/shurtles-section";
import { ShurtlesSectionSkeleton } from "@/components/dashboard/shurtles-section-skeleton";
import { Stats } from "@/components/dashboard/stats";
import { StatsSkeleton } from "@/components/dashboard/stats-skeleton";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your shurtles.",
}

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
