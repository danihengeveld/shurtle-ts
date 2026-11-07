import { analyticsHref, parseAnalyticsQuery } from "@/lib/analytics";
import { linkDetailsPath } from "@/lib/link-list";
import { displayShortUrl } from "@/lib/site";
import { getOwnLinkAnalytics } from "@/server/analytics";
import { getOwnShurtle } from "@/server/queries";
import type { Metadata } from "next";
import { io } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { LinkAnalytics } from "../../_components/analytics/link-analytics";

/** Link ids are UUIDs: anything else is a 404 without a query. */
const linkId = z.uuid();

/**
 * Render time: the end of the range, and what relative dates render from on the server and during
 * hydration. io() keeps it out of the static shell (see links-page.tsx for why not connection()).
 */
async function requestTime() {
  await io();
  return Date.now();
}

export async function generateMetadata({
  params,
}: PageProps<"/dashboard/links/[id]">): Promise<Metadata> {
  const { id } = await params;
  const own = linkId.safeParse(id).success ? await getOwnShurtle(id) : null;
  return {
    title: own ? displayShortUrl(own.shurtle.slug) : "Link not found",
  };
}

/**
 * /dashboard/links/[id]: one of the signed-in user's links and how it's used. Anyone else's link,
 * and ids that don't exist, get a 404, never a redirect: the page doesn't confirm a link exists.
 */
export default async function LinkPage({
  params,
  searchParams,
}: PageProps<"/dashboard/links/[id]">) {
  const { id } = await params;
  if (!linkId.safeParse(id).success) notFound();

  const analytics = await getOwnLinkAnalytics(id);
  if (!analytics) notFound();

  const basePath = linkDetailsPath(id);
  const { range, page, canonical } = parseAnalyticsQuery(await searchParams);
  if (!canonical) redirect(analyticsHref(basePath, { range, page }));
  const now = await requestTime();

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <LinkAnalytics
        link={analytics.link}
        source={analytics.source}
        range={range}
        page={page}
        now={now}
        basePath={basePath}
      />
    </div>
  );
}
