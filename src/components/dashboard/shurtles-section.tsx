import { getPaginatedShurtles } from "@/lib/shurtles";
import { auth } from "@clerk/nextjs/server";
import { ShurtlesTable } from "./shurtles-table";

interface ShurtlesSectionProps {
  searchParams?: Promise<{ page?: string; perPage?: string }>
}

export async function ShurtlesSection({ searchParams }: ShurtlesSectionProps) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  // Get the pagination parameters from the URL or use defaults
  const page = Number((await searchParams)?.page) || 1
  const perPage = Number((await searchParams)?.perPage) || 10

  // Fetch the paginated shurtles
  const { shurtles, totalPages } = await getPaginatedShurtles(userId, page, perPage)

  return <ShurtlesTable shurtles={shurtles} currentPage={page} totalPages={totalPages} perPage={perPage} />
}
