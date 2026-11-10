"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { QrCodeIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { Dialog as DialogPrimitive } from "radix-ui";
import { SheetDialog } from "../sheet-dialog";

// The encoder loads when the dialog first opens, not with the dashboard.
const QrCodePanel = dynamic(() => import("./qr-code-panel"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center px-5 pb-6 sm:px-7">
      <Skeleton className="aspect-square w-full max-w-64 rounded-2xl" />
      <Skeleton className="mt-4 h-8 w-48" />
    </div>
  ),
});

/**
 * A link's QR code, to print or put on a slide, with SVG and PNG downloads. Only for live links:
 * an expired one doesn't redirect, so a printed code would lead nowhere.
 */
export function QrCodeDialog({
  slug,
  open,
  onOpenChange,
  returnFocus,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Where focus goes when the dialog closes (the menu item that opened it is gone by then). */
  returnFocus: () => void;
}) {
  return (
    <SheetDialog
      open={open}
      onOpenChange={onOpenChange}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        returnFocus();
      }}
      className="sm:max-w-sm"
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <header className="px-5 pt-6 pr-16 pb-5 sm:px-7 sm:pt-7">
          <div
            aria-hidden
            className="mb-4 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <QrCodeIcon className="size-5" />
          </div>
          <DialogPrimitive.Title className="font-display text-[1.375rem] leading-tight font-semibold tracking-tight">
            QR code for{" "}
            <span className="font-mono text-[0.9em] font-medium break-all">
              /{slug}
            </span>
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
            Scanning it opens the short link. Download it for posters, slides or
            flyers.
          </DialogPrimitive.Description>
        </header>
        <QrCodePanel slug={slug} />
      </div>
    </SheetDialog>
  );
}
