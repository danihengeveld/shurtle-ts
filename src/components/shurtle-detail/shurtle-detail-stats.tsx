import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getShurtleAnalytics, getShurtleGeoAnalytics } from "@/lib/shurtles"
import { BarChart3, Globe, TrendingUp } from "lucide-react"
import { unstable_cache as cache } from "next/cache"

interface ShurtleDetailStatsProps {
  slug: string
}

export async function ShurtleDetailStats({ slug }: ShurtleDetailStatsProps) {
  const getAnalyticsCached = cache(
    async () => {
      const [analytics, geoAnalytics] = await Promise.all([
        getShurtleAnalytics(slug),
        getShurtleGeoAnalytics(slug)
      ])
      return { analytics, geoAnalytics }
    },
    [slug],
    {
      revalidate: 300, // 5 minutes
      tags: [`shurtle:${slug}`, `analytics:${slug}`]
    }
  )

  const { analytics, geoAnalytics } = await getAnalyticsCached()

  // Calculate some basic stats
  const totalDaysWithHits = analytics.length
  const totalHitsFromAnalytics = analytics.reduce((sum, day) => sum + day.hits, 0)
  const uniqueCountries = new Set(geoAnalytics.map(g => g.country).filter(Boolean)).size
  const peakDayHits = Math.max(...analytics.map(day => day.hits), 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Days</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDaysWithHits}</div>
          <p className="text-xs text-muted-foreground">
            {totalDaysWithHits === 1 ? 'Day' : 'Days'} with hits
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{peakDayHits}</div>
          <p className="text-xs text-muted-foreground">
            Highest hits in a day
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Countries</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueCountries}</div>
          <p className="text-xs text-muted-foreground">
            {uniqueCountries === 1 ? 'Country' : 'Countries'} reached
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Daily</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalDaysWithHits > 0 ? Math.round(totalHitsFromAnalytics / totalDaysWithHits) : 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Average hits per day
          </p>
        </CardContent>
      </Card>
    </div>
  )
}