"use client";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AnalyticsLink } from "@/lib/analytics";
import { linkLifecycle } from "@/lib/link-lifecycle";
import { linksPath } from "@/lib/link-list";
import { displayShortUrl, siteInfo } from "@/lib/site";
import {
  CalendarClockIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CopyButton } from "../copy-button";
import { ExpiryBadge } from "../expiry-badge";
import { formatDate } from "../format";
import { DeleteLinkDialog } from "../links/delete-link-dialog";
import { EditDestinationDialog } from "../links/edit-destination-dialog";
import {
  LinkExpiry,
  RenewButton,
  useOpenExpiryEditor,
} from "../links/expiry-editor";
import { Destination } from "../links/link-rows";
import { useNow } from "../time";

const host = siteInfo.baseUrl.host;

/**
 * The link the page is about: short link, destination, state and dates, and what can be done with
 * it. Expired links can't be copied (they don't redirect), like on the dashboard. The demo shows
 * the same header without actions.
 */
export function LinkHeader({
  link,
  demo = false,
}: {
  link: AnalyticsLink;
  demo?: boolean;
}) {
  const { now } = useNow();
  const expiresAt = link.expiresAt === null ? null : new Date(link.expiresAt);
  const { state } = linkLifecycle({ expiresAt, archived: link.archived }, now);
  const live = state === "live";
  const createdAt = new Date(link.createdAt);
  const listHref = demo ? "/" : linksPath(live ? "active" : "expired");

  return (
    <header>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={listHref}>
                {demo ? siteInfo.name : live ? "Links" : "Expired links"}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate font-mono text-[13px]">
              {demo ? "Demo" : `/${link.slug}`}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mt-5 flex flex-col gap-5 sm:mt-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="min-w-0">
          {live ? (
            <Badge
              variant="outline"
              className="h-6 gap-1.5 border-success/35 bg-success/10 px-2.5"
            >
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              Active
            </Badge>
          ) : (
            <ExpiryBadge expiresAt={link.expiresAt} archived={link.archived} />
          )}

          <h1 className="mt-3 font-display text-[1.75rem] leading-tight font-semibold tracking-tight break-all sm:text-4xl">
            <span className="font-medium text-muted-foreground">{host}/</span>
            <span className={live ? undefined : "text-muted-foreground"}>
              {link.slug}
            </span>
          </h1>

          <p className="mt-2 flex min-w-0 items-center gap-2 text-muted-foreground">
            <span aria-hidden className="shrink-0 text-sm">
              →
            </span>
            <span className="sr-only">Goes to</span>
            <Destination url={link.url} className="text-[15px]" />
          </p>

          <dl className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <dt>Created</dt>
              <dd className="text-foreground">
                {/* UTC, like every other date on the page ("times in UTC"). */}
                <time dateTime={createdAt.toISOString()}>
                  {formatDate(createdAt, { timeZone: "UTC", withYear: true })}
                </time>
              </dd>
            </div>
            {live && (
              <>
                <span
                  aria-hidden
                  className="size-0.5 rounded-full bg-muted-foreground/60"
                />
                <div className="flex items-center">
                  <dt className="sr-only">Expiry</dt>
                  <dd>
                    {expiresAt === null ? (
                      "Never expires"
                    ) : demo ? (
                      <ExpiryBadge expiresAt={link.expiresAt} />
                    ) : (
                      <LinkExpiry link={link} />
                    )}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {!demo && (
          <HeaderActions
            link={link}
            live={live}
            holdsSlug={state !== "released"}
          />
        )}
      </div>
    </header>
  );
}

const action = "h-10 flex-1 sm:h-9 sm:flex-none";

function HeaderActions({
  link,
  live,
  holdsSlug,
}: {
  link: AnalyticsLink;
  live: boolean;
  /** Live or renewable: its destination can still be changed. */
  holdsSlug: boolean;
}) {
  const router = useRouter();
  const openExpiryEditor = useOpenExpiryEditor(link);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <ButtonGroup aria-label="Link actions" className="w-full sm:w-fit">
        {live ? (
          <CopyButton
            slug={link.slug}
            label
            variant="outline"
            className={action}
          />
        ) : (
          <RenewButton link={link} className={`${action} rounded-md`} />
        )}
        <Button asChild variant="outline" className={action}>
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            <ExternalLinkIcon aria-hidden />
            Open
            <span className="sr-only"> destination (opens in a new tab)</span>
          </a>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              ref={menuRef}
              variant="outline"
              size="icon"
              className="size-10 data-[state=open]:bg-accent sm:size-9"
            >
              <EllipsisIcon aria-hidden />
              <span className="sr-only">
                More actions for {displayShortUrl(link.slug)}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
            {live && (
              <DropdownMenuItem
                onSelect={() => openExpiryEditor(menuRef.current)}
                className="h-9 rounded-lg"
              >
                <CalendarClockIcon aria-hidden />
                Change expiry…
              </DropdownMenuItem>
            )}
            {holdsSlug && (
              <DropdownMenuItem
                onSelect={() => setEditOpen(true)}
                className="h-9 rounded-lg"
              >
                <PencilIcon aria-hidden />
                Edit destination…
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setConfirmOpen(true)}
              className="h-9 rounded-lg"
            >
              <Trash2Icon aria-hidden />
              Delete…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>

      <EditDestinationDialog
        link={link}
        open={editOpen}
        onOpenChange={setEditOpen}
        returnFocus={() => menuRef.current?.focus()}
      />

      <DeleteLinkDialog
        link={link}
        expired={!live}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        // Its page goes with it: back to the list it was in.
        onDeleted={() => router.replace(linksPath(live ? "active" : "expired"))}
        returnFocus={(deleted) => {
          if (!deleted) menuRef.current?.focus();
        }}
      />
    </>
  );
}
