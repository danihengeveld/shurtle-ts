import { requireUserId } from "@/server/auth";
import { getStats } from "@/server/queries";
import { LinkSearch } from "./link-search";
import { LinksHeading } from "./links-heading";
import { StatusTabs } from "./status-tabs";

/**
 * Heading, Active / Expired tabs and search, in the dashboard layout so they stay mounted (and the
 * search keeps focus) while the list below changes. A brand-new account gets just the heading: the
 * list shows the "create your first link" state instead. Render inside <Suspense>.
 */
export async function LinksToolbar() {
  const userId = await requireUserId();
  // Cached and shared with the stats section.
  const stats = await getStats(userId);

  if (stats.totalShurtles === 0) return <LinksHeading />;

  return (
    <LinksHeading
      tabs={
        <StatusTabs
          counts={{
            active: stats.activeShurtles,
            expired: stats.expiredShurtles,
          }}
        />
      }
    >
      <LinkSearch className="w-full sm:w-80" />
    </LinksHeading>
  );
}
