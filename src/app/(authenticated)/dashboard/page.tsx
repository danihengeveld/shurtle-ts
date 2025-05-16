import { auth } from "@clerk/nextjs/server"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { ShurtlesSection } from "@/components/dashboard/shurtles-section"
import { StatsSection } from "@/components/dashboard/stats-section";

export default async function DashboardPage(
  props: {
    searchParams: Promise<{ page?: string; perPage?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <DashboardHeader />
      {/* Stats section - fetches its own data */}
      <StatsSection userId={userId} />
      {/* Shurtles table section - fetches its own data with pagination */}
      <ShurtlesSection userId={userId} searchParams={searchParams} />
    </div>
  )
}
