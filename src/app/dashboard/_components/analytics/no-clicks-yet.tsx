import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { AnalyticsLink } from "@/lib/analytics";
import { linkLifecycle } from "@/lib/link-lifecycle";
import { displayShortUrl } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, ChartColumnIcon } from "lucide-react";
import Link from "next/link";
import { CopyButton } from "../copy-button";

/**
 * A link nobody has clicked yet gets one invitation to share it instead of a page of empty charts.
 * The range doesn't matter yet, so there's no range toggle either.
 */
export function NoClicksYet({
  link,
  now,
}: {
  link: AnalyticsLink;
  now: number;
}) {
  const live =
    linkLifecycle(
      {
        expiresAt: link.expiresAt === null ? null : new Date(link.expiresAt),
        archived: link.archived,
      },
      now,
    ).state === "live";

  return (
    <Empty className="relative isolate mt-8 overflow-hidden rounded-3xl border border-solid bg-card py-14 shadow-soft sm:mt-10 sm:py-20">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 mask-[radial-gradient(60%_70%_at_50%_40%,black,transparent)]"
      >
        <div className="size-full shell-pattern" />
      </div>
      <EmptyHeader className="max-w-md">
        <EmptyMedia
          variant="icon"
          className="size-12 rounded-2xl text-muted-foreground [&_svg:not([class*='size-'])]:size-5"
        >
          <ChartColumnIcon aria-hidden />
        </EmptyMedia>
        <EmptyTitle
          role="heading"
          aria-level={2}
          className="font-display text-xl font-semibold text-balance"
        >
          {live ? "No clicks yet" : "It expired without a click"}
        </EmptyTitle>
        <EmptyDescription className="text-pretty">
          {live ? (
            <>
              Share{" "}
              <span className="font-mono text-foreground">
                {displayShortUrl(link.slug)}
              </span>{" "}
              and every click shows up here: when people click, where they are,
              which sites send them and what they use.
            </>
          ) : (
            "Nobody opened this link while it was live, so there's nothing to show."
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-col justify-center gap-2 min-[25rem]:flex-row">
        {live && (
          <CopyButton
            slug={link.slug}
            label
            variant="outline"
            className="h-10 sm:h-9"
          />
        )}
        <Button asChild variant="ghost" className="h-10 sm:h-9">
          <Link href="/demo">
            See it with sample data
            <ArrowRightIcon aria-hidden />
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
