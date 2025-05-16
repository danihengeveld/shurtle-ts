import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function ShurtlesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Destination URL</TableHead>
              <TableHead className="text-right">Hits</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Hit</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-5 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[200px]" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-[40px] ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
