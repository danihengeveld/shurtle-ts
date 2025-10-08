import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShurtleHit } from "@/db/schema"
import { format, formatDistanceToNow } from "date-fns"
import { Clock } from "lucide-react"

interface ShurtleRecentHitsProps {
  hits: ShurtleHit[]
}

export function ShurtleRecentHits({ hits }: ShurtleRecentHitsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Hits ({hits.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hits.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No hits recorded yet
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Country</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hits.map((hit) => {
                  const locationString = [hit.city, hit.region]
                    .filter(Boolean)
                    .join(', ') || 'Unknown Location'
                  
                  return (
                    <TableRow key={hit.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {formatDistanceToNow(hit.at, { addSuffix: true })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(hit.at, 'PPpp')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{locationString}</TableCell>
                      <TableCell>{hit.country || 'Unknown'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}