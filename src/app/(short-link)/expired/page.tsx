import { SLUG_PATTERN } from "@/lib/slugs";
import type { Metadata } from "next";
import { io } from "next/cache";
import { Suspense } from "react";
import { StatusPage } from "../../_components/status-view";
import { ExpiredView } from "./expired-view";

export const metadata: Metadata = {
  title: "Link expired",
  description: "This short link has expired and no longer redirects.",
  robots: { index: false },
};

/**
 * Shown by the proxy (rewrite, HTTP 410) when someone opens a short link that has expired. The
 * browser URL is still the short link; the proxy passes its slug and, while the owner can still
 * renew it, when the slug is released. It reveals nothing about the link's owner or destination.
 */
export default function ExpiredPage({ searchParams }: PageProps<"/expired">) {
  return (
    <StatusPage>
      {/* The generic version is the static shell; the slug-specific one streams in. */}
      <Suspense
        fallback={<ExpiredView slug={null} releasesAt={null} serverNow={0} />}
      >
        <ExpiredForSlug searchParams={searchParams} />
      </Suspense>
    </StatusPage>
  );
}

async function ExpiredForSlug({
  searchParams,
}: Pick<PageProps<"/expired">, "searchParams">) {
  const { slug, releasesAt } = await searchParams;
  // Anyone can open /expired?slug=…: only accept what a stored slug can look like.
  const validSlug =
    typeof slug === "string" && slug.length <= 255 && SLUG_PATTERN.test(slug)
      ? slug
      : null;
  const releaseTime =
    typeof releasesAt === "string" ? Date.parse(releasesAt) : Number.NaN;

  return (
    <ExpiredView
      slug={validSlug}
      releasesAt={
        validSlug && Number.isFinite(releaseTime) ? releaseTime : null
      }
      serverNow={await requestTime()}
    />
  );
}

/** The countdown's starting point: request time, kept out of the static shell. */
async function requestTime() {
  await io();
  return Date.now();
}
