import { requireUserId } from "@/server/auth";
import { getDailyClicks, getStats } from "@/server/queries";
import { ClicksChart } from "./clicks-chart";
import { StatsCards } from "./stats-cards";

/*
 * Data wrappers for the overview. Each one authenticates on its own (the proxy doesn't guard
 * /dashboard) and must be rendered inside its own <Suspense> boundary.
 */

export async function StatsSection() {
  const userId = await requireUserId();
  const [stats, daily] = await Promise.all([
    getStats(userId),
    getDailyClicks(userId, 30),
  ]);
  return <StatsCards stats={stats} daily={daily} />;
}

export async function ClicksSection() {
  const userId = await requireUserId();
  const daily = await getDailyClicks(userId, 30);
  return <ClicksChart daily={daily} />;
}
