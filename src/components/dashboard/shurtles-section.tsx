import { Suspense } from "react"
import { getPaginatedShurtles } from "@/lib/shurtles"
import { ShurtlesTable } from "./shurtles-table"
import { ShurtlesTableSkeleton } from "./shurtles-table-sekelton"

interface ShurtlesSectionProps {
  userId: string
  searchParams?: { page?: string; perPage?: string }
}

export async function ShurtlesSection({ userId, searchParams = { page: "1", perPage: "10" } }: ShurtlesSectionProps) {
  // Get the pagination parameters from the URL or use defaults
  const page = Number(searchParams.page) || 1
  const perPage = Number(searchParams.perPage) || 10

  // Fetch the paginated shurtles
  const { shurtles, totalPages } = await getPaginatedShurtles(userId, page, perPage)

  return (
    <Suspense fallback={<ShurtlesTableSkeleton />}>
      <ShurtlesTable shurtles={shurtles} currentPage={page} totalPages={totalPages} perPage={perPage} />
    </Suspense>
  )
}
