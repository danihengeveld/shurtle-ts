import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ShurtlesSection } from "@/components/dashboard/shurtles-section";
import { StatsSection } from "@/components/dashboard/stats-section";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; perPage?: string }>
}) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <DashboardHeader />
      {/* Stats section - fetches its own data */}
      <StatsSection userId={userId} />
      {/* Shurtles table section - fetches its own data with pagination */}
      <ShurtlesSection userId={userId} searchParams={await searchParams} />
    </div>
  )
}
