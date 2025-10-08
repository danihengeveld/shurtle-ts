import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getShurtleAnalytics } from "@/lib/shurtles"
import { unstable_cache as cache } from "next/cache"
import { format } from "date-fns"
import { ShurtleHitsChart } from "./shurtle-hits-chart"

interface ShurtleHitsAnalyticsProps {
  slug: string
}

export async function ShurtleHitsAnalytics({ slug }: ShurtleHitsAnalyticsProps) {
  const getAnalyticsCached = cache(
    async () => {
      return await getShurtleAnalytics(slug)
    },
    [slug],
    {
      revalidate: 300, // 5 minutes
      tags: [`shurtle:${slug}`, `analytics:${slug}`]
    }
  )

  const analytics = await getAnalyticsCached()

  // Transform data for the chart
  const chartData = analytics.map(day => ({
    date: day.date,
    hits: day.hits,
    formattedDate: format(new Date(day.date), 'MMM d')
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Hits Over Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No hit data available yet
          </div>
        ) : (
          <ShurtleHitsChart data={chartData} />
        )}
      </CardContent>
    </Card>
  )
}