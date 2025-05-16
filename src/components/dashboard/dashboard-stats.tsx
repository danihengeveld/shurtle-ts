import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link, LinkIcon } from "lucide-react"

interface DashboardStatsProps {
  stats: {
    totalShurtles: number
    totalHits: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Shurtles</CardTitle>
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalShurtles}</div>
          <p className="text-xs text-muted-foreground">URLs you've shortened</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Hits</CardTitle>
          <Link className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalHits}</div>
          <p className="text-xs text-muted-foreground">Clicks on all your shurtles</p>
        </CardContent>
      </Card>
    </div>
  )
}
