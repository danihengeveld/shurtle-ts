import { requireUserId } from "@/lib/auth"
import { parseDashboardQuery, type DashboardSearchParams } from "@/lib/pagination"
import { getDailyClicks, getShurtlesPaginated, getStats } from "@/lib/shurtles"
import { ClicksChart } from "./clicks-chart"
import { LinksPanel } from "./links/links-panel"
import { StatsCards } from "./stats-cards"

/*
 * Data wrappers for the dashboard. Each one authenticates on its own (the proxy no longer guards
 * /dashboard) and must be rendered inside its own <Suspense> boundary.
 */

export async function StatsSection() {
  const userId = await requireUserId()
  const [stats, daily] = await Promise.all([getStats(userId), getDailyClicks(userId, 30)])
  return <StatsCards stats={stats} daily={daily} />
}

export async function ClicksSection() {
  const userId = await requireUserId()
  const daily = await getDailyClicks(userId, 30)
  return <ClicksChart daily={daily} />
}

async function loadLinks(searchParams: Promise<DashboardSearchParams>) {
  const userId = await requireUserId()
  const query = parseDashboardQuery(await searchParams)
  const page = await getShurtlesPaginated(userId, query)
  // Request time (read after the request-time APIs above). Relative dates render from it on the
  // server and during hydration, so both match, and then tick on the client.
  return { page, now: Date.now() }
}

export async function LinksSection({ searchParams }: { searchParams: Promise<DashboardSearchParams> }) {
  const { page, now } = await loadLinks(searchParams)

  return (
    <LinksPanel
      now={now}
      data={{
        ...page,
        shurtles: page.shurtles.map(({ slug, url, hits, createdAt, lastHitAt, expiresAt }) => ({
          slug,
          url,
          hits,
          createdAt,
          lastHitAt,
          expiresAt,
        })),
      }}
    />
  )
}
