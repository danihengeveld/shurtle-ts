import {
  parseLinkListQuery,
  type LinkListSearchParams,
  type LinkStatus,
} from "@/lib/link-list";
import {
  getRenewableShurtles,
  getShurtlesPaginated,
  getStats,
} from "@/server/queries";
import { io } from "next/cache";
import type { LinkRow } from "./link-rows";
import { LinksPanel } from "./links-panel";

/** How many renewable links the "Just expired" group lists before linking to the rest. */
const RENEWABLE_SHOWN = 5;

type LinkRecord = Awaited<ReturnType<typeof getRenewableShurtles>>[number];

/** Only what the lists render (no user id, no archive timestamp) goes to the client. */
function toLinkRow({ archivedAt, ...link }: LinkRecord): LinkRow {
  return { ...link, archived: archivedAt !== null };
}

async function loadLinks(
  status: LinkStatus,
  searchParams: LinkListSearchParams,
) {
  const query = parseLinkListQuery(status, searchParams);
  // "Just expired" sits above the first page of the active list; a search is about that list.
  const showRenewable =
    status === "active" && query.page === 1 && query.query === "";
  // The stats are cached and shared with the overview and the tabs; they give the empty states
  // (and the "Just expired" group) their counts.
  const [page, stats, renewable] = await Promise.all([
    getShurtlesPaginated(query),
    getStats(),
    showRenewable ? getRenewableShurtles(RENEWABLE_SHOWN) : [],
  ]);
  // Render time. Relative dates render from it on the server and during hydration, so both match,
  // and then tick on the client. io() keeps it out of the static shell but, unlike connection(),
  // still lets a prefetch resolve the list: a slightly early `now` is harmless since it ticks.
  await io();
  return { page, stats, renewable, now: Date.now() };
}

/** The page body of `/dashboard` and `/dashboard/expired`. */
export async function LinksPage({
  status,
  searchParams,
}: {
  status: LinkStatus;
  searchParams: LinkListSearchParams;
}) {
  const { page, stats, renewable, now } = await loadLinks(status, searchParams);

  return (
    <LinksPanel
      now={now}
      data={{
        ...page,
        counts: {
          active: stats.activeShurtles,
          expired: stats.expiredShurtles,
        },
        shurtles: page.shurtles.map(toLinkRow),
        renewable: {
          links: renewable.map(toLinkRow),
          // Separate cache entries: never claim fewer than are shown.
          total: Math.max(stats.renewableShurtles, renewable.length),
        },
      }}
    />
  );
}
