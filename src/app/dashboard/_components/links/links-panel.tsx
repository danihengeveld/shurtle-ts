import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DEFAULT_PER_PAGE,
  PER_PAGE_OPTIONS,
  linksHref,
  type LinkListQuery,
  type LinkStatus,
} from "@/lib/link-list";
import { releaseTime } from "@/lib/link-lifecycle";
import { siteInfo } from "@/lib/site";
import { cn } from "cn";
import {
  ArchiveIcon,
  ArrowRightIcon,
  LinkIcon,
  SearchXIcon,
} from "lucide-react";
import Link from "next/link";
import { ViewTransition } from "react";
import { CreateLinkButton } from "../create/create-link-provider";
import { formatCount } from "../format";
import { ServerNowProvider } from "../time";
import { ExpiryEditorProvider } from "./expiry-editor";
import { LinksList, LinksTable, type LinkRow } from "./link-rows";
import { LinksPagination } from "./links-pagination";
import { LinksNavLink } from "./links-provider";
import { PerPageSelect } from "./per-page-select";
import { RefreshAt } from "./refresh-at";
import { RenewableLinks } from "./renewable-links";

export type LinksPage = LinkListQuery & {
  shurtles: LinkRow[];
  totalCount: number;
  totalPages: number;
  /** Unfiltered totals per status, for the empty states. */
  counts: Record<LinkStatus, number>;
  /** The "Just expired" group: only on the first page of the active list, without a search. */
  renewable?: { links: LinkRow[]; total: number };
};

/** When each shown link next changes state: its expiry, or the end of its renewal window. */
function stateChanges(links: LinkRow[]) {
  return links.flatMap(({ expiresAt, archived }) =>
    expiresAt && !archived
      ? [expiresAt.getTime(), releaseTime(expiresAt).getTime()]
      : [],
  );
}

/**
 * One page of links: table (≥ md) / stacked list (< md), pagination and empty states.
 * Presentational: the heading, tabs and search live in the dashboard layout.
 */
export function LinksPanel({
  data,
  now,
}: {
  data: LinksPage;
  /** Request time (ms) used to render relative dates on the server without hydration mismatches. */
  now: number;
}) {
  const {
    shurtles: links,
    totalCount,
    totalPages,
    page,
    perPage,
    query,
    status,
    counts,
    renewable,
  } = data;
  const expired = status === "expired";
  const first = (page - 1) * perPage + 1;
  const last = first + links.length - 1;
  const kind = expired ? "expired " : "";
  const noun = query
    ? totalCount === 1
      ? "result"
      : "results"
    : `${kind}${totalCount === 1 ? "link" : "links"}`;
  const label = query
    ? `${expired ? "Expired links" : "Links"} matching “${query}”`
    : expired
      ? "Expired links"
      : "Active links";

  // The toolbar hides the tabs and search for a brand-new account; keep this in step with it.
  if (counts.active + counts.expired === 0) return <EmptyAccount />;

  const list =
    totalCount === 0 && !query ? (
      expired ? (
        <NoExpiredLinks />
      ) : (
        <NoActiveLinks
          expiredHref={linksHref({ status: "expired", perPage })}
          expiredCount={counts.expired}
        />
      )
    ) : totalCount === 0 ? (
      <NoResults
        query={query}
        expired={expired}
        clearHref={linksHref({ status, perPage })}
      />
    ) : links.length === 0 ? (
      <PageOutOfRange
        page={page}
        lastHref={linksHref(
          { status, page: totalPages, perPage, query },
          "links",
        )}
        totalPages={totalPages}
      />
    ) : (
      <>
        <LinksTable links={links} expired={expired} caption={label} />
        <LinksList links={links} expired={expired} label={label} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <p className="text-sm text-muted-foreground tabular-nums max-sm:mr-auto">
            Showing{" "}
            <span className="font-medium text-foreground">
              {formatCount(first)}–{formatCount(last)}
            </span>{" "}
            of{" "}
            <span className="font-medium text-foreground">
              {formatCount(totalCount)}
            </span>{" "}
            {noun}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3 max-sm:contents sm:ml-auto">
            {(totalPages > 1 ||
              totalCount > PER_PAGE_OPTIONS[0] ||
              perPage !== DEFAULT_PER_PAGE) && (
              <PerPageSelect status={status} perPage={perPage} query={query} />
            )}
            {totalPages > 1 && (
              <LinksPagination
                page={page}
                totalPages={totalPages}
                perPage={perPage}
                query={query}
                status={status}
              />
            )}
          </div>
        </div>
      </>
    );

  return (
    <ServerNowProvider now={now}>
      <ExpiryEditorProvider>
        <RefreshAt
          moments={stateChanges([...links, ...(renewable?.links ?? [])])}
        />
        <p className="sr-only" role="status">
          {query
            ? totalCount === 0
              ? `No ${kind}links match “${query}”.`
              : `${formatCount(totalCount)} ${noun} for “${query}”.`
            : ""}
        </p>
        {/* A list arriving whole is still; only its rows animate, as links join or leave it. */}
        <ViewTransition default="none">
          <div>
            {renewable && renewable.links.length > 0 && (
              <RenewableLinks
                links={renewable.links}
                total={renewable.total}
                expiredHref={linksHref({ status: "expired", perPage })}
              />
            )}
            {list}
          </div>
        </ViewTransition>
      </ExpiryEditorProvider>
    </ServerNowProvider>
  );
}

/** shadcn's Empty as a card: solid border, card surface and the soft shadow of the links table. */
function EmptyCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Empty
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border border-solid bg-card py-12 shadow-soft sm:py-16",
        className,
      )}
    >
      {children}
    </Empty>
  );
}

/** EmptyTitle renders a div; keep the heading outline (h2 "Links" → h3) for screen readers. */
function EmptyHeading({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <EmptyTitle
      role="heading"
      aria-level={3}
      className={cn(
        "font-display text-xl font-semibold text-balance",
        className,
      )}
    >
      {children}
    </EmptyTitle>
  );
}

const iconMedia =
  "size-12 rounded-2xl text-muted-foreground [&_svg:not([class*='size-'])]:size-5";
const action = "h-10 rounded-xl sm:h-9";

function EmptyAccount() {
  const host = siteInfo.baseUrl.host;
  return (
    <EmptyCard className="gap-7 sm:py-20">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 mask-[radial-gradient(60%_70%_at_50%_45%,black,transparent)]"
      >
        <div className="size-full shell-pattern" />
      </div>
      <EmptyHeader className="max-w-md gap-0">
        <EmptyMedia className="mb-8 w-full">
          <div className="w-fit max-w-full -rotate-2 rounded-2xl border bg-background/90 px-4 py-3 text-left font-mono text-sm shadow-lift backdrop-blur-sm">
            <p className="truncate text-muted-foreground line-through decoration-muted-foreground/40">
              yoursite.com/blog/2026/11/how-we…
            </p>
            <p className="mt-1 flex items-center gap-2">
              <ArrowRightIcon
                aria-hidden
                className="size-3.5 shrink-0 text-brand-ink"
              />
              <span className="truncate">
                <span className="text-muted-foreground">{host}/</span>
                <span className="font-semibold text-brand-ink">launch</span>
              </span>
            </p>
          </div>
        </EmptyMedia>
        <EmptyHeading className="text-2xl sm:text-[1.75rem]">
          Shorten your first link
        </EmptyHeading>
        <EmptyDescription className="mt-2 text-base text-pretty">
          Turn any long URL into a short, memorable link. Every click shows up
          right here.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <CreateLinkButton size="lg">Create your first link</CreateLinkButton>
      </EmptyContent>
    </EmptyCard>
  );
}

function NoActiveLinks({
  expiredHref,
  expiredCount,
}: {
  expiredHref: string;
  expiredCount: number;
}) {
  return (
    <EmptyCard>
      <EmptyHeader>
        <EmptyMedia variant="icon" className={iconMedia}>
          <LinkIcon aria-hidden />
        </EmptyMedia>
        <EmptyHeading>No active links</EmptyHeading>
        <EmptyDescription className="text-pretty">
          All of your links have expired. Create a new one, or look back at the{" "}
          {formatCount(expiredCount)} that ran their course.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-col justify-center gap-2 min-[25rem]:flex-row">
        <CreateLinkButton className={action}>New link</CreateLinkButton>
        <Button asChild variant="outline" className={action}>
          <Link href={expiredHref} scroll={false}>
            View expired links
          </Link>
        </Button>
      </EmptyContent>
    </EmptyCard>
  );
}

function NoExpiredLinks() {
  return (
    <EmptyCard>
      <EmptyHeader>
        <EmptyMedia variant="icon" className={iconMedia}>
          <ArchiveIcon aria-hidden />
        </EmptyMedia>
        <EmptyHeading>No expired links</EmptyHeading>
        <EmptyDescription className="text-pretty">
          Links you give an expiry date land here once it passes. They stop
          redirecting but keep their click history, and you have 24 hours to
          renew one before its slug is free for others.
        </EmptyDescription>
      </EmptyHeader>
    </EmptyCard>
  );
}

function NoResults({
  query,
  expired,
  clearHref,
}: {
  query: string;
  expired: boolean;
  clearHref: string;
}) {
  return (
    <EmptyCard>
      <EmptyHeader>
        <EmptyMedia variant="icon" className={iconMedia}>
          <SearchXIcon aria-hidden />
        </EmptyMedia>
        <EmptyHeading>
          No {expired ? "expired " : ""}links match{" "}
          <span className="break-all">“{query}”</span>
        </EmptyHeading>
        <EmptyDescription className="text-pretty">
          Search looks at slugs and destination URLs. Check the spelling or try
          a shorter term.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline" className={action}>
          <LinksNavLink href={clearHref}>Clear search</LinksNavLink>
        </Button>
      </EmptyContent>
    </EmptyCard>
  );
}

function PageOutOfRange({
  page,
  totalPages,
  lastHref,
}: {
  page: number;
  totalPages: number;
  lastHref: string;
}) {
  return (
    <EmptyCard>
      <EmptyHeader>
        <EmptyMedia className="font-mono text-sm text-muted-foreground tabular-nums">
          page {formatCount(page)} / {formatCount(totalPages)}
        </EmptyMedia>
        <EmptyHeading>This page is empty</EmptyHeading>
        <EmptyDescription className="text-pretty">
          There{" "}
          {totalPages === 1
            ? "is only 1 page"
            : `are only ${formatCount(totalPages)} pages`}{" "}
          of links. Some may have been deleted.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline" className={action}>
          <LinksNavLink href={lastHref}>
            Go to{" "}
            {totalPages === 1
              ? "the first page"
              : `page ${formatCount(totalPages)}`}
          </LinksNavLink>
        </Button>
      </EmptyContent>
    </EmptyCard>
  );
}
