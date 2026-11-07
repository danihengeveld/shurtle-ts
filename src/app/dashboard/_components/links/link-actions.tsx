"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { linkLifecycle } from "@/lib/link-lifecycle";
import { linkDetailsPath } from "@/lib/link-list";
import { displayShortUrl } from "@/lib/site";
import { cn } from "cn";
import {
  CalendarClockIcon,
  ChartColumnIcon,
  CopyIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useCopyShortLink } from "../copy-button";
import { useNow } from "../time";
import { DeleteLinkDialog } from "./delete-link-dialog";
import { useOpenExpiryEditor } from "./expiry-editor";
import type { LinkRow } from "./link-rows";
import { useLinks } from "./links-provider";

export function LinkActions({
  link,
  className,
}: {
  link: LinkRow;
  className?: string;
}) {
  const { id, slug, url } = link;
  const { markDeleting } = useLinks();
  const { copy } = useCopyShortLink(slug);
  const openExpiryEditor = useOpenExpiryEditor(link);
  const { now } = useNow();
  // Expired links can't be copied (they don't redirect); renewable ones can be brought back.
  const { state } = linkLifecycle(
    {
      expiresAt: link.expiresAt === null ? null : new Date(link.expiresAt),
      archived: link.archived,
    },
    now,
  );
  const expired = state !== "live";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon-sm"
            className={cn(
              "text-muted-foreground hover:text-foreground data-[state=open]:bg-accent",
              className,
            )}
          >
            <EllipsisIcon aria-hidden />
            <span className="sr-only">Actions for {displayShortUrl(slug)}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
          <DropdownMenuItem asChild className="h-9 rounded-lg">
            <Link href={linkDetailsPath(id)}>
              <ChartColumnIcon aria-hidden />
              View details
            </Link>
          </DropdownMenuItem>
          {state === "renewable" && (
            <DropdownMenuItem
              onSelect={() => openExpiryEditor(triggerRef.current)}
              className="h-9 rounded-lg"
            >
              <RotateCcwIcon aria-hidden />
              Renew…
            </DropdownMenuItem>
          )}
          {!expired && (
            <DropdownMenuItem onSelect={copy} className="h-9 rounded-lg">
              <CopyIcon aria-hidden />
              Copy short link
            </DropdownMenuItem>
          )}
          {!expired && (
            <DropdownMenuItem
              onSelect={() => openExpiryEditor(triggerRef.current)}
              className="h-9 rounded-lg"
            >
              <CalendarClockIcon aria-hidden />
              Change expiry…
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild className="h-9 rounded-lg">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon aria-hidden />
              Open destination
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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

      <DeleteLinkDialog
        link={link}
        expired={expired}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onStart={() => markDeleting(id)}
        returnFocus={(deleted) => {
          // Back to the row's menu button, or, when the row is about to disappear, to the list
          // heading so keyboard and screen reader users keep their place.
          if (deleted) document.getElementById("links-heading")?.focus();
          else triggerRef.current?.focus();
        }}
      />
    </>
  );
}
