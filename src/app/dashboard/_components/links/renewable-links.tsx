import { RENEWAL_WINDOW_HOURS } from "@/lib/link-lifecycle";
import { linkDetailsPath } from "@/lib/link-list";
import { ArrowRightIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { formatCount } from "../format";
import { LinkExpiry, RenewButton } from "./expiry-editor";
import { Destination, ShortLink, type LinkRow } from "./link-rows";
import { LinkListItem } from "./links-provider";

/**
 * "Just expired": the user's links in their renewal window, above the active list where they'll
 * see them. It only exists while there's something to act on, and each link leaves it on its own
 * (renewed, or released when its window ends).
 */
export function RenewableLinks({
  links,
  total,
  expiredHref,
}: {
  /** The most urgent first. */
  links: LinkRow[];
  /** All renewable links, of which `links` may be the first few. */
  total: number;
  expiredHref: string;
}) {
  return (
    <section
      aria-labelledby="renewable-heading"
      className="mb-4 overflow-hidden rounded-2xl border border-brand-ink/20 bg-brand-soft/35 shadow-soft dark:border-brand-ink/25 dark:bg-brand-soft/15"
    >
      <header className="flex items-start gap-3 px-4 pt-4 pb-3 sm:px-5">
        <div
          aria-hidden
          className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink dark:bg-brand-soft/70"
        >
          <RotateCcwIcon className="size-4" />
        </div>
        <div className="min-w-0">
          <h3
            id="renewable-heading"
            className="flex items-center gap-2 font-display text-base font-semibold tracking-tight"
          >
            Just expired
            <span className="rounded-full bg-brand-ink/12 px-2 py-0.5 font-sans text-xs font-medium text-foreground tabular-nums">
              {formatCount(total)}
            </span>
          </h3>
          <p className="mt-0.5 text-sm text-pretty text-muted-foreground">
            {total === 1 ? "This link has" : "These links have"} stopped
            working. Renew within {RENEWAL_WINDOW_HOURS} hours of expiry to keep
            the slug and its clicks; after that, anyone can claim it.
          </p>
        </div>
      </header>

      <ul className="divide-y divide-brand-ink/10 border-t border-brand-ink/10 bg-card/70 dark:bg-card/40">
        {links.map((link) => (
          <LinkListItem
            key={link.id}
            id={link.id}
            href={linkDetailsPath(link.id)}
            className="flex flex-col gap-2.5 px-4 py-3 transition-[background-color,opacity] duration-200 hover:bg-card data-deleting:opacity-40 sm:flex-row sm:items-center sm:gap-4 sm:px-5 dark:hover:bg-card/70"
          >
            <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:gap-4">
              <ShortLink
                slug={link.slug}
                href={linkDetailsPath(link.id)}
                className="text-sm sm:w-[min(16rem,40%)] sm:shrink-0 md:text-[13px]"
              />
              <Destination url={link.url} className="min-w-0 max-sm:-mt-0.5" />
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <LinkExpiry link={link} />
              <RenewButton link={link} className="max-sm:h-9" />
            </div>
          </LinkListItem>
        ))}
      </ul>

      {total > links.length && (
        <Link
          href={expiredHref}
          scroll={false}
          className="group flex items-center justify-center gap-1.5 border-t border-brand-ink/10 px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors outline-none hover:bg-brand-soft/40 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset"
        >
          See all {formatCount(total)} under Expired
          <ArrowRightIcon
            aria-hidden
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </section>
  );
}
