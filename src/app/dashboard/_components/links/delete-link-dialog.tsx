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
import { Spinner } from "@/components/ui/spinner";
import { displayShortUrl } from "@/lib/site";
import { deleteShurtle } from "@/server/actions";
import { Trash2Icon } from "lucide-react";
import { startTransition, useRef, useTransition } from "react";
import { toast } from "sonner";

/**
 * "Delete /slug?" confirmation. Deletes on confirm, toasts the outcome and keeps the dialog open
 * until whatever `onDeleted` starts has committed, so focus never lands on a row that's gone.
 */
export function DeleteLinkDialog({
  link: { id, slug },
  expired,
  open,
  onOpenChange,
  onStart,
  onDeleted,
  returnFocus,
}: {
  link: { id: string; slug: string };
  /** Expired links get different copy: they already stopped redirecting. */
  expired: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Runs inside the delete transition as it starts, e.g. to dim the row optimistically. */
  onStart?: () => void;
  /** Runs inside a transition once the link is gone, e.g. to leave its page. */
  onDeleted?: () => void;
  /** Where focus goes when the dialog closes; `deleted` says whether the link is gone. */
  returnFocus: (deleted: boolean) => void;
}) {
  const [isDeleting, startDelete] = useTransition();
  const deleted = useRef(false);

  function confirmDelete() {
    startDelete(async () => {
      onStart?.();
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
      // the refreshed page (without this link) commits, so focus doesn't jump ahead of it.
      startTransition(() => {
        onOpenChange(false);
        if (result.ok) onDeleted?.();
      });
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
    <AlertDialog
      open={open}
      onOpenChange={(next) => !isDeleting && onOpenChange(next)}
    >
      <AlertDialogContent
        className="gap-5 rounded-2xl sm:max-w-md"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus(deleted.current);
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
            {isDeleting ? <Spinner aria-hidden /> : <Trash2Icon aria-hidden />}
            {isDeleting ? "Deleting…" : "Delete link"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
