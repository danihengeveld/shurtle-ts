import type { Shurtle } from "@/db/schema"
import { siteInfo } from "@/lib/site"
import { cn } from "cn"
import { ArrowUpRightIcon, MousePointerClickIcon } from "lucide-react"
import { CopyButton } from "../copy-button"
import { ExpiryBadge } from "../expiry-badge"
import { formatCount, splitUrl } from "../format"
import { RelativeTime } from "../time"
import { LinkActions } from "./link-actions"
import { LinkListItem, LinkTableRow } from "./links-provider"

/** Only what the list renders; keeps the RSC payload small. */
export type LinkRow = Pick<Shurtle, "slug" | "url" | "hits" | "createdAt" | "lastHitAt" | "expiresAt">

const host = siteInfo.baseUrl.host

function ShortLink({
  slug,
  compactHost = false,
  expired = false,
  className,
}: {
  slug: string
  compactHost?: boolean
  /** Expired links are muted: they no longer redirect. */
  expired?: boolean
  className?: string
}) {
  return (
    <span className={cn("min-w-0 truncate font-mono text-[13px] leading-6", className)} title={`${host}/${slug}`}>
      {/* In the table, the repeated host only shows when there's room; the slug matters most. */}
      <span className={cn("text-muted-foreground", compactHost && "max-xl:sr-only")}>{host}</span>
      <span className="text-muted-foreground">/</span>
      <span className={cn("font-medium", expired ? "text-muted-foreground" : "text-foreground")}>{slug}</span>
    </span>
  )
}

function Destination({ url, className }: { url: string; className?: string }) {
  const { host: destinationHost, rest } = splitUrl(url)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={url}
      className={cn(
        "group/destination inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="min-w-0 truncate">
        <span className="font-medium text-foreground decoration-foreground/30 underline-offset-4 group-hover/destination:underline">
          {destinationHost}
        </span>
        <span className="text-muted-foreground">{rest}</span>
      </span>
      <ArrowUpRightIcon
        aria-hidden
        className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/destination:opacity-100 group-focus-visible/destination:opacity-100"
      />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

function Clicks({ hits }: { hits: number }) {
  return <span className={cn("tabular-nums", hits === 0 ? "text-muted-foreground" : "font-medium")}>{formatCount(hits)}</span>
}

const th = "h-10 px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground first:pl-5 last:pr-3"
const td = "h-[3.75rem] px-3 align-middle first:pl-5 last:pr-3"

export function LinksTable({ links, expired = false, caption }: { links: LinkRow[]; expired?: boolean; caption: string }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-soft md:block">
      <table className="w-full table-fixed border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          <col className="w-[28%] lg:w-[24%]" />
          <col />
          <col className="w-20" />
          <col className="hidden w-28 lg:table-column" />
          <col className="hidden w-28 lg:table-column" />
          <col className="w-40" />
          <col className="w-14" />
        </colgroup>
        <thead className="border-b bg-muted/45 dark:bg-muted/30">
          <tr>
            <th scope="col" className={th}>
              Short link
            </th>
            <th scope="col" className={th}>
              Destination
            </th>
            <th scope="col" className={cn(th, "text-right")}>
              Clicks
            </th>
            <th scope="col" className={cn(th, "hidden lg:table-cell")}>
              Created
            </th>
            <th scope="col" className={cn(th, "hidden lg:table-cell")}>
              Last click
            </th>
            <th scope="col" className={th}>
              {expired ? "Expired" : "Expires"}
            </th>
            <th scope="col" className={th}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => (
            <LinkTableRow
              key={link.slug}
              slug={link.slug}
              className="border-b transition-[background-color,opacity] duration-200 last:border-0 hover:bg-muted/40 data-deleting:opacity-40 dark:hover:bg-muted/25"
            >
              <td className={td}>
                <div className="flex min-w-0 items-center gap-0.5">
                  <ShortLink slug={link.slug} compactHost expired={expired} />
                  {/* A dead link isn't worth sharing: no copy for expired links. */}
                  {!expired && <CopyButton slug={link.slug} className="shrink-0" />}
                </div>
              </td>
              <td className={td}>
                <Destination url={link.url} />
              </td>
              <td className={cn(td, "text-right")}>
                <Clicks hits={link.hits} />
              </td>
              <td className={cn(td, "hidden text-muted-foreground lg:table-cell")}>
                <RelativeTime date={link.createdAt} />
              </td>
              <td className={cn(td, "hidden text-muted-foreground lg:table-cell")}>
                {link.lastHitAt ? (
                  <RelativeTime date={link.lastHitAt} />
                ) : (
                  <>
                    <span aria-hidden>—</span>
                    <span className="sr-only">Never</span>
                  </>
                )}
              </td>
              <td className={td}>
                <ExpiryBadge expiresAt={link.expiresAt} />
              </td>
              <td className={cn(td, "text-right")}>
                <LinkActions slug={link.slug} url={link.url} expired={expired} />
              </td>
            </LinkTableRow>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Stacked layout for small screens (< md). */
export function LinksList({ links, expired = false, label }: { links: LinkRow[]; expired?: boolean; label: string }) {
  return (
    <ul aria-label={label} className="divide-y overflow-hidden rounded-2xl border bg-card shadow-soft md:hidden">
      {links.map((link) => (
        <LinkListItem
          key={link.slug}
          slug={link.slug}
          className="py-3 pr-2 pl-4 transition-opacity duration-200 data-deleting:opacity-40"
        >
          <div className="flex items-center gap-1">
            <ShortLink slug={link.slug} expired={expired} className="flex-1 text-sm" />
            {!expired && <CopyButton slug={link.slug} size="icon-lg" className="shrink-0" />}
            <LinkActions slug={link.slug} url={link.url} expired={expired} className="size-10 shrink-0" />
          </div>
          <div className="pr-2">
            <Destination url={link.url} className="-mt-0.5" />
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MousePointerClickIcon aria-hidden className="size-3.5" />
                <Clicks hits={link.hits} />
                <span>{link.hits === 1 ? "click" : "clicks"}</span>
              </span>
              <span aria-hidden className="size-0.5 rounded-full bg-muted-foreground/60" />
              <span>
                Created <RelativeTime date={link.createdAt} />
              </span>
              {link.expiresAt && <ExpiryBadge expiresAt={link.expiresAt} compact />}
            </div>
          </div>
        </LinkListItem>
      ))}
    </ul>
  )
}
