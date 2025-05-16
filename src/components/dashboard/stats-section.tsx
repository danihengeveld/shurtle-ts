import { getUserStats } from "@/lib/shurtles"
import { Suspense } from "react"
import { Stats } from "./stats"
import { StatsSkeleton } from "./stats-skeleton"

interface StatsSectionProps {
  userId: string
}

export async function StatsSection({ userId }: StatsSectionProps) {
  const stats = await getUserStats(userId)

  return (
    <Suspense fallback={<StatsSkeleton />}>
      <Stats stats={stats} />
    </Suspense>
  )
}
