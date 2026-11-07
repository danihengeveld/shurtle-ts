import { Button } from "@/components/ui/button";
import { parseAnalyticsQuery } from "@/lib/analytics";
import { demoAnalytics } from "@/lib/demo-analytics";
import { ArrowRightIcon, FlaskConicalIcon } from "lucide-react";
import type { Metadata } from "next";
import { io } from "next/cache";
import Link from "next/link";
import { LinkAnalytics } from "../../dashboard/_components/analytics/link-analytics";

export const metadata: Metadata = {
  title: "Demo: link analytics",
  description:
    "See what Shurtle shows for every link: clicks over time, a world map, when people click, which sites send them and what they use.",
};

/** Sample data relative to the moment of the request (see links-page.tsx for why io()). */
async function requestTime() {
  await io();
  return Date.now();
}

/**
 * /demo: a link's page as its owner sees it, filled with sample data, for anyone to try. The same
 * components as /dashboard/links/[id]; only the data source differs, and nothing can be changed.
 */
export default async function DemoPage({ searchParams }: PageProps<"/demo">) {
  const { range, page } = parseAnalyticsQuery(await searchParams);
  const now = await requestTime();
  const { link, source } = demoAnalytics(now);

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <aside
        aria-label="About this demo"
        className="mb-8 flex flex-col gap-4 rounded-2xl border border-brand-ink/20 bg-brand-soft/60 p-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-brand-ink/25 dark:bg-brand-soft/25"
      >
        <div className="flex gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-brand-ink shadow-soft">
            <FlaskConicalIcon aria-hidden className="size-4.5" />
          </span>
          <p className="text-sm text-pretty">
            <span className="font-semibold">A demo with sample data.</span>{" "}
            <span className="text-muted-foreground">
              Every link you shorten gets a page like this, filled with its own
              clicks. Bots don&apos;t count.
            </span>
          </p>
        </div>
        <Button
          asChild
          variant="brand"
          className="group h-10 shrink-0 rounded-xl px-4 sm:h-9 sm:rounded-lg"
        >
          <Link href="/dashboard">
            Shorten a link
            <ArrowRightIcon
              aria-hidden
              className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
            />
          </Link>
        </Button>
      </aside>

      <LinkAnalytics
        link={link}
        source={source}
        range={range}
        page={page}
        now={now}
        basePath="/demo"
        demo
      />
    </div>
  );
}
