import { CreateLinkButton } from "@/components/create/create-link-provider"
import { Button } from "@/components/ui/button"
import { TabsContent } from "@/components/ui/tabs"
import { DEFAULT_PER_PAGE, PER_PAGE_OPTIONS, type DashboardQuery, type LinkStatus } from "@/lib/pagination"
import { siteInfo } from "@/lib/site"
import { cn } from "cn"
import { ArchiveIcon, ArrowRightIcon, LinkIcon, SearchXIcon } from "lucide-react"
import Link from "next/link"
import { formatCount } from "../format"
import { ServerNowProvider } from "../time"
import { linksHref } from "./href"
import { LinkSearch } from "./link-search"
import { LinksList, LinksTable, type LinkRow } from "./link-rows"
import { LinksPagination } from "./links-pagination"
import { LinksBusyRegion, LinksProvider } from "./links-provider"
import { PerPageSelect } from "./per-page-select"
import { StatusTabs, StatusTabsList } from "./status-tabs"

export type LinksPage = DashboardQuery & {
  shurtles: LinkRow[]
  totalCount: number
  totalPages: number
  /** Unfiltered totals per status, for the tabs. */
  counts: Record<LinkStatus, number>
}

export function LinksHeading({ tabs, children }: { tabs?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:min-h-10 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <h2
          id="links-heading"
          tabIndex={-1}
          className="font-display text-xl font-semibold tracking-tight outline-none sm:text-[1.375rem]"
        >
          Links
        </h2>
        {tabs}
      </div>
      {children}
    </div>
  )
}

/**
 * The links list: search, table (≥ md) / stacked list (< md), pagination and empty states.
 * Presentational: give it a page of links from `getShurtlesPaginated` and the request time.
 */
export function LinksPanel({
  data,
  now,
  basePath = "/dashboard",
  deleteAction,
}: {
  data: LinksPage
  /** Request time (ms) used to render relative dates on the server without hydration mismatches. */
  now: number
  basePath?: string
  deleteAction?: React.ComponentProps<typeof LinksProvider>["deleteAction"]
}) {
  const { shurtles: links, totalCount, totalPages, page, perPage, query, status, counts } = data
  const isEmptyAccount = counts.active + counts.expired === 0 && !query
  const expired = status === "expired"
  const first = (page - 1) * perPage + 1
  const last = first + links.length - 1
  const kind = expired ? "expired " : ""
  const noun = query
    ? totalCount === 1
      ? "result"
      : "results"
    : `${kind}${totalCount === 1 ? "link" : "links"}`
  const label = query ? `${expired ? "Expired links" : "Links"} matching “${query}”` : expired ? "Expired links" : "Active links"

  const list = isEmptyAccount ? (
    <EmptyAccount />
  ) : totalCount === 0 && !query ? (
    expired ? (
      <NoExpiredLinks />
    ) : (
      <NoActiveLinks expiredHref={linksHref(basePath, { status: "expired", perPage })} expiredCount={counts.expired} />
    )
  ) : totalCount === 0 ? (
    <NoResults query={query} expired={expired} clearHref={linksHref(basePath, { status, perPage })} />
  ) : links.length === 0 ? (
    <PageOutOfRange
      page={page}
      lastHref={linksHref(basePath, { page: totalPages, perPage, query, status }, "links")}
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
          of <span className="font-medium text-foreground">{formatCount(totalCount)}</span> {noun}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-3 max-sm:contents sm:ml-auto">
          {(totalPages > 1 || totalCount > PER_PAGE_OPTIONS[0] || perPage !== DEFAULT_PER_PAGE) && (
            <PerPageSelect perPage={perPage} query={query} />
          )}
          {totalPages > 1 && (
            <LinksPagination
              basePath={basePath}
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
  )

  return (
    <LinksProvider basePath={basePath} status={status} deleteAction={deleteAction}>
      <ServerNowProvider now={now}>
        <StatusTabs status={status}>
          <div id="links" className="scroll-mt-24">
            <LinksHeading tabs={isEmptyAccount ? undefined : <StatusTabsList counts={counts} />}>
              {!isEmptyAccount && <LinkSearch query={query} perPage={perPage} className="w-full sm:w-80" />}
            </LinksHeading>

            <LinksBusyRegion className="mt-4">
              <p className="sr-only" role="status">
                {query
                  ? totalCount === 0
                    ? `No ${kind}links match “${query}”.`
                    : `${formatCount(totalCount)} ${noun} for “${query}”.`
                  : ""}
              </p>

              {isEmptyAccount ? list : <TabsContent value={status}>{list}</TabsContent>}
            </LinksBusyRegion>
          </div>
        </StatusTabs>
      </ServerNowProvider>
    </LinksProvider>
  )
}

function EmptyCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-3xl border bg-card px-6 py-12 text-center shadow-soft sm:py-16",
        className,
      )}
    >
      {children}
    </div>
  )
}

function EmptyAccount() {
  const host = siteInfo.baseUrl.host
  return (
    <EmptyCard className="sm:py-20">
      <div aria-hidden className="absolute inset-0 -z-10 mask-[radial-gradient(60%_70%_at_50%_45%,black,transparent)]">
        <div className="shell-pattern size-full" />
      </div>
      <div className="mx-auto max-w-md">
        <div
          aria-hidden
          className="mx-auto w-fit max-w-full -rotate-2 rounded-2xl border bg-background/90 px-4 py-3 text-left font-mono text-sm shadow-lift backdrop-blur-sm"
        >
          <p className="truncate text-muted-foreground line-through decoration-muted-foreground/40">
            yoursite.com/blog/2026/11/how-we…
          </p>
          <p className="mt-1 flex items-center gap-2">
            <ArrowRightIcon className="size-3.5 shrink-0 text-brand-ink" />
            <span className="truncate">
              <span className="text-muted-foreground">{host}/</span>
              <span className="font-semibold text-brand-ink">launch</span>
            </span>
          </p>
        </div>
        <h3 className="mt-8 font-display text-2xl font-semibold tracking-tight text-balance sm:text-[1.75rem]">
          Shorten your first link
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-pretty text-muted-foreground">
          Turn any long URL into a short, memorable link. Every click shows up right here.
        </p>
        <CreateLinkButton size="lg" className="mt-7">
          Create your first link
        </CreateLinkButton>
      </div>
    </EmptyCard>
  )
}

function NoActiveLinks({ expiredHref, expiredCount }: { expiredHref: string; expiredCount: number }) {
  return (
    <EmptyCard>
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <LinkIcon aria-hidden className="size-5" />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-balance">No active links</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
        All of your links have expired. Create a new one, or look back at the {formatCount(expiredCount)} that ran
        their course.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2 min-[25rem]:flex-row">
        <CreateLinkButton className="h-10 rounded-xl sm:h-9">New link</CreateLinkButton>
        <Button asChild variant="outline" className="h-10 rounded-xl sm:h-9">
          <Link href={expiredHref} scroll={false}>
            View expired links
          </Link>
        </Button>
      </div>
    </EmptyCard>
  )
}

function NoExpiredLinks() {
  return (
    <EmptyCard>
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <ArchiveIcon aria-hidden className="size-5" />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-balance">No expired links</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
        Links you give an expiry date land here once it passes. They stop redirecting, but keep their click history.
      </p>
    </EmptyCard>
  )
}

function NoResults({ query, expired, clearHref }: { query: string; expired: boolean; clearHref: string }) {
  return (
    <EmptyCard>
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <SearchXIcon aria-hidden className="size-5" />
      </div>
      <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-balance">
        No {expired ? "expired " : ""}links match <span className="break-all">“{query}”</span>
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
        Search looks at slugs and destination URLs. Check the spelling or try a shorter term.
      </p>
      <Button asChild variant="outline" className="mt-6 h-10 rounded-xl sm:h-9">
        <Link href={clearHref} scroll={false}>
          Clear search
        </Link>
      </Button>
    </EmptyCard>
  )
}

function PageOutOfRange({ page, totalPages, lastHref }: { page: number; totalPages: number; lastHref: string }) {
  return (
    <EmptyCard>
      <p className="font-mono text-sm text-muted-foreground tabular-nums">
        page {formatCount(page)} / {formatCount(totalPages)}
      </p>
      <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">This page is empty</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
        There {totalPages === 1 ? "is only 1 page" : `are only ${formatCount(totalPages)} pages`} of links. Some may have
        been deleted.
      </p>
      <Button asChild variant="outline" className="mt-6 h-10 rounded-xl sm:h-9">
        <Link href={lastHref}>Go to {totalPages === 1 ? "the first page" : `page ${formatCount(totalPages)}`}</Link>
      </Button>
    </EmptyCard>
  )
}
