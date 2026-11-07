import { getDailyClicks, getStats } from "@/server/queries";
import { ClicksChart } from "./clicks-chart";
import { StatsCards } from "./stats-cards";

/*
 * Data wrappers for the overview. The getters authenticate on their own (the proxy doesn't guard
 * /dashboard); render each wrapper inside its own <Suspense> boundary.
 */

export async function StatsSection() {
  const [stats, daily] = await Promise.all([getStats(), getDailyClicks(30)]);
  return <StatsCards stats={stats} daily={daily} />;
}

export async function ClicksSection() {
  const daily = await getDailyClicks(30);
  return <ClicksChart daily={daily} />;
}
