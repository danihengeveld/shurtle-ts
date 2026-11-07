import {
  parseLinkListQuery,
  type LinkListSearchParams,
  type LinkStatus,
} from "@/lib/link-list";
import { requireUserId } from "@/server/auth";
import { getShurtlesPaginated, getStats } from "@/server/queries";
import { connection } from "next/server";
import { LinksPanel } from "./links-panel";

async function loadLinks(
  status: LinkStatus,
  searchParams: LinkListSearchParams,
) {
  const userId = await requireUserId();
  const query = parseLinkListQuery(status, searchParams);
  // The stats are cached and shared with the overview and the tabs; they give the empty states
  // their counts.
  const [page, stats] = await Promise.all([
    getShurtlesPaginated(userId, query),
    getStats(userId),
  ]);
  // Request time. Relative dates render from it on the server and during hydration, so both match,
  // and then tick on the client. Cookies and searchParams alone don't make this request-time: a
  // runtime prefetch (partialPrefetching) can resolve them, so defer explicitly with connection().
  await connection();
  return { page, stats, now: Date.now() };
}

/** The page body of `/dashboard` and `/dashboard/expired`. */
export async function LinksPage({
  status,
  searchParams,
}: {
  status: LinkStatus;
  searchParams: LinkListSearchParams;
}) {
  const { page, stats, now } = await loadLinks(status, searchParams);

  return (
    <LinksPanel
      now={now}
      data={{
        ...page,
        counts: {
          active: stats.activeShurtles,
          expired: stats.expiredShurtles,
        },
        shurtles: page.shurtles.map(
          ({ slug, url, hits, createdAt, lastHitAt, expiresAt }) => ({
            slug,
            url,
            hits,
            createdAt,
            lastHitAt,
            expiresAt,
          }),
        ),
      }}
    />
  );
}
