import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getShurtleGeoAnalytics } from "@/lib/shurtles"
import { Globe } from "lucide-react"
import { unstable_cache as cache } from "next/cache"

interface ShurtleGeoAnalyticsProps {
  slug: string
}

export async function ShurtleGeoAnalytics({ slug }: ShurtleGeoAnalyticsProps) {
  const getGeoAnalyticsCached = cache(
    async () => {
      return await getShurtleGeoAnalytics(slug)
    },
    [slug],
    {
      revalidate: 300, // 5 minutes
      tags: [`shurtle:${slug}`, `geo-analytics:${slug}`]
    }
  )

  const geoAnalytics = await getGeoAnalyticsCached()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Geographic Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {geoAnalytics.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No geographic data available yet
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {geoAnalytics.map((location, index) => {
              const locationString = [location.city, location.region, location.country]
                .filter(Boolean)
                .join(', ') || 'Unknown Location'
              
              return (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {locationString}
                    </p>
                    {location.country && (
                      <p className="text-xs text-muted-foreground">
                        {location.country}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {location.hits} {location.hits === 1 ? 'hit' : 'hits'}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}