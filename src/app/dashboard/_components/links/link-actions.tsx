"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { displayShortUrl } from "@/lib/site";
import { deleteShurtle } from "@/server/actions";
import { cn } from "cn";
import { Spinner } from "@/components/ui/spinner";
import { linkLifecycle } from "@/lib/link-lifecycle";
import {
  CalendarClockIcon,
  CopyIcon,
  ExternalLinkIcon,
  EllipsisIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";
import { startTransition, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { useCopyShortLink } from "../copy-button";
import { useNow } from "../time";
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
  const [isDeleting, startDelete] = useTransition();
  const deleted = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function confirmDelete() {
    startDelete(async () => {
      markDeleting(id);
      let result;
      try {
        result = await deleteShurtle(id);
      } catch {
        result = {
          ok: false,
          error:
            "Something went wrong while deleting your link. Please try again.",
        } as const;
      }

      deleted.current = result.ok;
      // Updates after an `await` leave the transition unless re-wrapped; keep the dialog open until
      // the refreshed list (without this row) commits, so focus doesn't jump ahead of it.
      startTransition(() => setConfirmOpen(false));
      if (result.ok) {
        toast.success("Link deleted", {
          description: expired
            ? `${displayShortUrl(slug)} and its click history are gone.`
            : `${displayShortUrl(slug)} no longer redirects.`,
        });
      } else {
        toast.error(`Couldn't delete ${displayShortUrl(slug)}`, {
          description: result.error,
        });
      }
    });
  }

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

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => !isDeleting && setConfirmOpen(open)}
      >
        <AlertDialogContent
          className="gap-5 rounded-2xl sm:max-w-md"
          onCloseAutoFocus={(event) => {
            // Return focus to the row's menu button, or, when the row is about to disappear, to the
            // list heading so keyboard and screen reader users keep their place.
            event.preventDefault();
            if (deleted.current)
              document.getElementById("links-heading")?.focus();
            else triggerRef.current?.focus();
          }}
        >
          <AlertDialogHeader className="place-items-start gap-3 text-left">
            <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2Icon aria-hidden className="size-5" />
            </div>
            <AlertDialogTitle className="font-display text-xl font-semibold tracking-tight">
              Delete{" "}
              <span className="font-mono text-[0.9em] font-medium break-all">
                /{slug}
              </span>
              ?
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              {expired ? (
                <>
                  This expired link and its click history will be removed for
                  good, and the slug can be used again.
                </>
              ) : (
                <>
                  <span className="font-mono text-foreground">
                    {displayShortUrl(slug)}
                  </span>{" "}
                  will stop working right away and its click history will be
                  removed.
                </>
              )}{" "}
              This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting} className="max-sm:h-10">
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="max-sm:h-10"
            >
              {isDeleting ? (
                <Spinner aria-hidden />
              ) : (
                <Trash2Icon aria-hidden />
              )}
              {isDeleting ? "Deleting…" : "Delete link"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
