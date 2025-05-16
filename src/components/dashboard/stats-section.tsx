import { getUserStats } from "@/lib/shurtles"
import { DashboardStats } from "./dashboard-stats"

interface StatsSectionProps {
  userId: string
}

export async function StatsSection({ userId }: StatsSectionProps) {
  const stats = await getUserStats(userId)

  return <DashboardStats stats={stats} />
}
