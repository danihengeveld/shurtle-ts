import { getShurtlesPaginated } from "@/lib/shurtles";
import { auth } from "@clerk/nextjs/server";
import { unstable_cache as cache } from "next/cache";
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
  const getShurtlesPaginatedCached = cache(
    async () => {
      return await getShurtlesPaginated(userId, page, perPage)
    },
    [userId, page.toString(), perPage.toString()],
    {
      revalidate: 60,
      tags: [`user:${userId}`, `shurtles:${userId}`]
    }
  );

  const { shurtles, totalPages } = await getShurtlesPaginatedCached()

  return <ShurtlesTable shurtles={shurtles} currentPage={page} totalPages={totalPages} perPage={perPage} />
}